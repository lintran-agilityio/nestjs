import { handleSummaryFactory } from '../helpers/summary';
// libs
import http from 'k6/http';
import { check, group } from 'k6';
import { Trend } from 'k6/metrics';

// helpers
import {
  BASE_URL,
  commonThresholds,
  jsonHeaders,
  AUTH_PATH,
  EMAIL_FIELD,
  PASSWORD_FIELD,
  TOKEN_FIELD,
  USER_EMAIL,
  USER_PASSWORD,
} from '../helpers/config';

let cachedAccessToken: string | null = null;
const getAuthHeaders = (): { headers: { Authorization: string } } => {
  if (!cachedAccessToken) {
    const payload = JSON.stringify({
      [EMAIL_FIELD]: USER_EMAIL,
      [PASSWORD_FIELD]: USER_PASSWORD,
    });
    const res = http.post(`${BASE_URL}/${AUTH_PATH}`, payload, {
      headers: jsonHeaders.headers,
    });
    const body = res.json() as Record<string, string> | null;
    const token = body && body[TOKEN_FIELD];
    if (res.status !== 200 || !token) {
      throw new Error(`Auth failed: ${res.status} ${res.body}`);
    }
    cachedAccessToken = token;
  }
  return { headers: { Authorization: `Bearer ${cachedAccessToken}` } };
};

const createPostTrend = new Trend('create_post_duration');
const createCommentTrend = new Trend('create_comment_duration');
const viewPostTrend = new Trend('view_post_duration');

// Treat 404 and 409 as expected statuses to avoid counting them as failed
// requests in http_req_failed metrics (e.g., eventual consistency or slug conflicts)
http.setResponseCallback(
  http.expectedStatuses({ min: 200, max: 399 }, 404, 409),
);

const POSTS_PATH = 'posts';
const COMMENTS_PATH = 'comments';

export const options = {
  vus: 20,
  duration: '1m',
  thresholds: {
    'http_req_failed{type:success}': commonThresholds.http_req_failed,
    'http_req_duration{type:success}': commonThresholds.http_req_duration,
    create_post_duration: ['p(95)<500'],
    create_comment_duration: ['p(95)<500'],
    view_post_duration: ['p(95)<400'],
  },
};

const successFlow = () => {
  group('User-Post-Comment Flow - success', () => {
    // Create post
    const postPayload = JSON.stringify({
      slug: `slug-${__VU}-${__ITER}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`,
      title: `Title ${__VU}-${__ITER}-${Date.now()}`,
      contents: 'Hello from k6 post',
    });
    const createPostRes = http.post(`${BASE_URL}/${POSTS_PATH}`, postPayload, {
      headers: {
        ...jsonHeaders.headers,
        ...getAuthHeaders().headers,
      },
      tags: { type: 'success', endpoint: 'create_post' },
    });
    createPostTrend.add(createPostRes.timings.duration);
    check(createPostRes, { 'create post 201': (r) => r.status === 201 });

    const postBody = createPostRes.json() as Record<string, any> | null;
    const postId = postBody && (postBody['id'] as string);

    if (createPostRes.status !== 201 || !postId) {
      return; // do not continue if post creation failed
    }

    // Add comment to the created post
    const commentPayload = JSON.stringify({
      content: 'Nice post from k6!',
      postId,
    });
    const createCommentRes = http.post(
      `${BASE_URL}/${COMMENTS_PATH}`,
      commentPayload,
      {
        headers: {
          ...jsonHeaders.headers,
          ...getAuthHeaders().headers,
        },
        tags: { type: 'success', endpoint: 'create_comment' },
      },
    );
    createCommentTrend.add(createCommentRes.timings.duration);
    check(createCommentRes, { 'create comment 201': (r) => r.status === 201 });

    // View post by id
    const viewRes = http.get(`${BASE_URL}/${POSTS_PATH}/${postId}`, {
      headers: {
        ...getAuthHeaders().headers,
      },
      tags: { type: 'success', endpoint: 'view_post' },
    });
    viewPostTrend.add(viewRes.timings.duration);
    check(viewRes, { 'view post 200': (r) => r.status === 200 });
  });
};

const failureFlow = () => {
  group('User-Post-Comment Flow - failures', () => {
    // Create post without token -> 401
    const badPostRes = http.post(
      `${BASE_URL}/${POSTS_PATH}`,
      JSON.stringify({ slug: 'a', title: 'b', contents: 'c' }),
      {
        ...jsonHeaders,
        tags: { type: 'expected_error', endpoint: 'create_post_no_token' },
      },
    );
    check(badPostRes, {
      'Failures: create post without token -> 401': (r) => r.status === 401,
    });

    // Create comment without token -> 401
    const badCommentRes = http.post(
      `${BASE_URL}/${COMMENTS_PATH}`,
      JSON.stringify({
        content: 'x',
        postId: '00000000-0000-0000-0000-000000000000',
      }),
      {
        ...jsonHeaders,
        tags: { type: 'expected_error', endpoint: 'create_comment_no_token' },
      },
    );
    check(badCommentRes, {
      'Failures: create comment without token -> 401': (r) => r.status === 401,
    });

    // Invalid post body with token -> 400 (missing required fields)
    const invalidPostRes = http.post(
      `${BASE_URL}/${POSTS_PATH}`,
      JSON.stringify({ title: 'only-title' }),
      {
        headers: {
          ...jsonHeaders.headers,
          ...getAuthHeaders().headers,
        },
        tags: { type: 'expected_error', endpoint: 'create_post_invalid_body' },
      },
    );
    check(invalidPostRes, {
      'Failures: create post invalid body -> 400': (r) => r.status === 400,
    });

    // Invalid comment body with token -> 400 (missing postId)
    const invalidCommentRes = http.post(
      `${BASE_URL}/${COMMENTS_PATH}`,
      JSON.stringify({ content: 'missing-postId' }),
      {
        headers: {
          ...jsonHeaders.headers,
          ...getAuthHeaders().headers,
        },
        tags: {
          type: 'expected_error',
          endpoint: 'create_comment_invalid_body',
        },
      },
    );
    check(invalidCommentRes, {
      'Failures: create comment invalid body -> 400': (r) => r.status === 400,
    });
  });
};

export default function () {
  successFlow();
  failureFlow();
}

export const handleSummary = handleSummaryFactory('comment');
