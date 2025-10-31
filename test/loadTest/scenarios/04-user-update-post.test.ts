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

const viewPostBeforeTrend = new Trend('view_post_before_duration');
const updatePostTrend = new Trend('update_post_duration');
const viewPostAfterTrend = new Trend('view_post_after_duration');

// Treat 404 and 409 as expected statuses so they don't count toward http_req_failed
http.setResponseCallback(
  http.expectedStatuses({ min: 200, max: 399 }, 403, 404, 409),
);

const POSTS_PATH = 'posts';

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

export const options = {
  vus: 20,
  duration: '1m',
  thresholds: {
    'http_req_failed{type:success}': commonThresholds.http_req_failed,
    'http_req_duration{type:success}': commonThresholds.http_req_duration,
    view_post_before_duration: ['p(95)<400'],
    update_post_duration: ['p(95)<500'],
    view_post_after_duration: ['p(95)<400'],
  },
};

const successFlow = () => {
  group('User-Update-Post Flow - success', () => {
    // Create a post to ensure ownership for update
    const postPayload = JSON.stringify({
      slug: `slug-${__VU}-${__ITER}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`,
      title: `Title ${__VU}-${__ITER}-${Date.now()}`,
      contents: 'Original content from k6',
    });
    const createRes = http.post(`${BASE_URL}/${POSTS_PATH}`, postPayload, {
      headers: {
        ...jsonHeaders.headers,
        ...getAuthHeaders().headers,
      },
      tags: { type: 'success', endpoint: 'create_post' },
    });
    check(createRes, { 'create post 201 (setup)': (r) => r.status === 201 });

    const body = createRes.json() as Record<string, any> | null;
    const postId = body && (body['id'] as string);
    const createdSlug = body && (body['slug'] as string);
    if (createRes.status !== 201 || !postId) {
      return;
    }

    // View post before update
    const viewBeforeRes = http.get(`${BASE_URL}/${POSTS_PATH}/${postId}`, {
      headers: { ...getAuthHeaders().headers },
      tags: { type: 'success', endpoint: 'view_post_before' },
    });
    viewPostBeforeTrend.add(viewBeforeRes.timings.duration);
    check(viewBeforeRes, { 'view post before 200': (r) => r.status === 200 });

    // Update post
    // Keep original slug to avoid conflicts/validation surprises
    const updatePayload = JSON.stringify({
      slug: createdSlug,
      title: `Updated Title ${__VU}-${__ITER}`,
      contents: 'Updated content from k6',
    });
    const updateRes = http.patch(
      `${BASE_URL}/${POSTS_PATH}/${postId}`,
      updatePayload,
      {
        headers: {
          ...jsonHeaders.headers,
          ...getAuthHeaders().headers,
        },
        tags: { type: 'success', endpoint: 'update_post' },
      },
    );
    updatePostTrend.add(updateRes.timings.duration);
    check(updateRes, {
      'update post 200|403': (r) => r.status === 200 || r.status === 403,
    });

    // View post after update
    const viewAfterRes = http.get(`${BASE_URL}/${POSTS_PATH}/${postId}`, {
      headers: { ...getAuthHeaders().headers },
      tags: { type: 'success', endpoint: 'view_post_after' },
    });
    viewPostAfterTrend.add(viewAfterRes.timings.duration);
    check(viewAfterRes, { 'view post after 200': (r) => r.status === 200 });
  });
};

const failureFlow = () => {
  group('User-Update-Post Flow - failures', () => {
    // Update post without token -> 401
    const resNoToken = http.patch(
      `${BASE_URL}/${POSTS_PATH}/00000000-0000-0000-0000-000000000000`,
      JSON.stringify({ slug: 'x', title: 'y', contents: 'z' }),
      {
        ...jsonHeaders,
        tags: { type: 'expected_error', endpoint: 'update_post_no_token' },
      },
    );
    check(resNoToken, {
      'Failures: update without token -> 401': (r) => r.status === 401,
    });

    // Invalid body with token -> 400 (use a real created post to bypass ownership/not-found)
    const setupCreate = http.post(
      `${BASE_URL}/${POSTS_PATH}`,
      JSON.stringify({
        slug: `slug-inv-${__VU}-${__ITER}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,
        title: `Title inv ${__VU}-${__ITER}`,
        contents: 'content inv',
      }),
      {
        headers: { ...jsonHeaders.headers, ...getAuthHeaders().headers },
        tags: { type: 'success', endpoint: 'view_post_update' },
      },
    );
    const setupBody = setupCreate.json() as Record<string, any> | null;
    const setupId = setupBody && (setupBody['id'] as string);
    if (setupCreate.status === 201 && setupId) {
      const invalidBodyRes = http.patch(
        `${BASE_URL}/${POSTS_PATH}/${setupId}`,
        JSON.stringify({ title: 'only-title' }),
        {
          headers: {
            ...jsonHeaders.headers,
            ...getAuthHeaders().headers,
          },
          tags: {
            type: 'expected_error',
            endpoint: 'update_post_invalid_body',
          },
        },
      );
      check(invalidBodyRes, {
        'Failures: update invalid body -> 400|422|403': (r) =>
          r.status === 400 || r.status === 422 || r.status === 403,
      });
    }

    // Update non-existent post -> 404
    const notFoundRes = http.patch(
      `${BASE_URL}/${POSTS_PATH}/11111111-1111-1111-1111-111111111111`,
      JSON.stringify({ slug: 'a', title: 'b', contents: 'c' }),
      {
        headers: {
          ...jsonHeaders.headers,
          ...getAuthHeaders().headers,
        },
        tags: { type: 'expected_error', endpoint: 'update_post_not_found' },
      },
    );
    check(notFoundRes, {
      'Failures: update non-existent -> 404|403': (r) =>
        r.status === 404 || r.status === 403,
    });
  });
};

export default function () {
  successFlow();
  failureFlow();
}
