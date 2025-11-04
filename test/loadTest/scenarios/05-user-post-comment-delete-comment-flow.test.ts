import { handleSummaryFactory } from '../helpers/summary';
// libs
import http from 'k6/http';
import { check, group } from 'k6';
import { Trend } from 'k6/metrics';

// helpers (config only; inline minimal auth to avoid import resolution issues)
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
const viewCommentTrend = new Trend('view_comment_duration');
const deleteCommentTrend = new Trend('delete_comment_duration');

// Treat 404 and 409 as expected statuses so they don't count toward http_req_failed
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
    view_comment_duration: ['p(95)<400'],
    delete_comment_duration: ['p(95)<400'],
  },
};

const successFlow = () => {
  group('User-Post-Comment-Delete Flow - success', () => {
    // 1) Create post
    const postPayload = JSON.stringify({
      slug: `slug-${__VU}-${__ITER}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`,
      title: `Title ${__VU}-${__ITER}-${Date.now()}`,
      contents: 'Post from k6 for comment deletion flow',
    });
    const createPostRes = http.post(`${BASE_URL}/${POSTS_PATH}`, postPayload, {
      headers: { ...jsonHeaders.headers, ...getAuthHeaders().headers },
      tags: { type: 'success', endpoint: 'create_post' },
    });
    createPostTrend.add(createPostRes.timings.duration);
    check(createPostRes, { 'create post 201': (r) => r.status === 201 });

    const postBody = createPostRes.json() as Record<string, any> | null;
    const postId = postBody && (postBody['id'] as string);
    if (createPostRes.status !== 201 || !postId) {
      return; // stop flow if post creation failed
    }

    // 2) Create comment on that post
    const commentPayload = JSON.stringify({ content: 'Nice post!', postId });
    const createCommentRes = http.post(
      `${BASE_URL}/${COMMENTS_PATH}`,
      commentPayload,
      {
        headers: { ...jsonHeaders.headers, ...getAuthHeaders().headers },
        tags: { type: 'success', endpoint: 'create_comment' },
      },
    );
    createCommentTrend.add(createCommentRes.timings.duration);
    check(createCommentRes, { 'create comment 201': (r) => r.status === 201 });

    const commentBody = createCommentRes.json() as Record<string, any> | null;
    const commentId = commentBody && (commentBody['id'] as string);
    if (createCommentRes.status !== 201 || !commentId) {
      return; // stop if comment creation failed
    }

    // 3) View the created comment
    const viewCommentRes = http.get(
      `${BASE_URL}/${COMMENTS_PATH}/${commentId}`,
      {
        headers: { ...getAuthHeaders().headers },
        tags: { type: 'success', endpoint: 'view_comment' },
      },
    );
    viewCommentTrend.add(viewCommentRes.timings.duration);
    check(viewCommentRes, { 'view comment 200': (r) => r.status === 200 });

    // 4) Delete the comment
    const deleteCommentRes = http.del(
      `${BASE_URL}/${COMMENTS_PATH}/${commentId}`,
      null,
      {
        headers: { ...getAuthHeaders().headers },
        tags: { type: 'success', endpoint: 'delete_comment' },
      },
    );
    deleteCommentTrend.add(deleteCommentRes.timings.duration);
    check(deleteCommentRes, {
      'delete comment 200': (r) => r.status === 200,
    });
  });
};

const failureFlow = () => {
  group('User-Post-Comment-Delete Flow - failures', () => {
    // Missing token when creating comment -> 401
    const resCreateCommentNoToken = http.post(
      `${BASE_URL}/${COMMENTS_PATH}`,
      JSON.stringify({ content: 'x', postId: '00000000-0000-0000-0000-000000000000' }),
      {
        ...jsonHeaders,
        tags: { type: 'expected_error', endpoint: 'create_comment_no_token' },
      },
    );
    check(resCreateCommentNoToken, {
      'Failures: create comment without token -> 401': (r) => r.status === 401,
    });

    // Invalid comment body with token -> 400 (missing postId)
    const resCreateCommentInvalid = http.post(
      `${BASE_URL}/${COMMENTS_PATH}`,
      JSON.stringify({ content: 'missing-postId' }),
      {
        headers: { ...jsonHeaders.headers, ...getAuthHeaders().headers },
        tags: { type: 'expected_error', endpoint: 'create_comment_invalid_body' },
      },
    );
    check(resCreateCommentInvalid, {
      'Failures: create comment invalid body -> 400': (r) => r.status === 400,
    });

    // View non-existent comment -> 404
    const resViewNotFound = http.get(
      `${BASE_URL}/${COMMENTS_PATH}/11111111-1111-1111-1111-111111111111`,
      {
        headers: { ...getAuthHeaders().headers },
        tags: { type: 'expected_error', endpoint: 'view_comment_not_found' },
      },
    );
    check(resViewNotFound, {
      'Failures: view non-existent comment -> 404': (r) => r.status === 404,
    });

    // Delete comment without token -> 401
    const resDeleteNoToken = http.del(
      `${BASE_URL}/${COMMENTS_PATH}/00000000-0000-0000-0000-000000000000`,
    );
    check(resDeleteNoToken, {
      'Failures: delete comment without token -> 401': (r) => r.status === 401,
    });

    // Delete non-existent comment with token -> 404 (or 403 depending on policy)
    const resDeleteNotFound = http.del(
      `${BASE_URL}/${COMMENTS_PATH}/22222222-2222-2222-2222-222222222222`,
      null,
      {
        headers: { ...getAuthHeaders().headers },
        tags: { type: 'expected_error', endpoint: 'delete_comment_not_found' },
      },
    );
    check(resDeleteNotFound, {
      'Failures: delete non-existent comment -> 404|403': (r) =>
        r.status === 404 || r.status === 403,
    });
  });
};

export default function () {
  successFlow();
  failureFlow();
}


export const handleSummary = handleSummaryFactory('delete');
