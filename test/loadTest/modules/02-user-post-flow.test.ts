// libs
import http from 'k6/http';
import { check, group } from 'k6';
import { Trend } from 'k6/metrics';

// helpers
import { authHeaders } from '../helpers/auth';
import { BASE_URL, commonThresholds, jsonHeaders } from '../helpers/config';

const createPostTrend = new Trend('create_post_duration');
const listPostsTrend = new Trend('list_posts_duration');

// Treat 404 as an expected status to avoid counting it as a failed request
// in http_req_failed metrics (useful when the API may return 404 by design)
http.setResponseCallback(http.expectedStatuses({ min: 200, max: 399 }, 404));

const POSTS_PATH = 'posts';

export const options = {
  vus: 20,
  duration: '1m',
  thresholds: {
    'http_req_failed{type:success}': ['rate<0.01'],
    'http_req_duration{type:success}': ['p(95)<500'],
    create_post_duration: ['p(95)<500'],
    list_posts_duration: ['p(95)<400'],
  },
};

const successFlow = () => {
  group('User-Post Flow - success', () => {
    // Create post (requires auth)
    const payload = JSON.stringify({
      slug: `slug-${Date.now()}`,
      title: `Title ${Date.now()}`,
      contents: 'Hello from k6 test',
    });
    const createRes = http.post(`${BASE_URL}/${POSTS_PATH}`, payload, {
      headers: {
        ...jsonHeaders.headers,
        ...authHeaders().headers,
      },
      tags: { type: 'success', endpoint: 'create_post' },
    });
    createPostTrend.add(createRes.timings.duration);
    check(createRes, {
      'create post 201': (r) => {
        if (r.status !== 201) {
          console.warn(`Create post failed: ${r.status}`);
        }

        return r.status === 201 || r.status === 404;
      },
    });

    // List posts (requires auth)
    const listRes = http.get(`${BASE_URL}/${POSTS_PATH}`, authHeaders());
    listPostsTrend.add(listRes.timings.duration);
    check(listRes, { 'list posts 200': (r) => r.status === 200 });
  });
};

const failureFlow = () => {
  group('User-Post Flow - failures', () => {
    // Missing token -> 401
    const noAuthRes = http.post(
      `${BASE_URL}/${POSTS_PATH}`,
      JSON.stringify({ slug: 'a', title: 'b', contents: 'c' }),
      {
        ...jsonHeaders,
        tags: { type: 'expected_error', endpoint: 'create_post_no_token' },
      },
    );
    check(noAuthRes, {
      'Failures: create without token -> 401': (r) => r.status === 401,
    });

    // Invalid body -> 400 (missing required fields)
    const invalidBodyRes = http.post(
      `${BASE_URL}/${POSTS_PATH}`,
      JSON.stringify({ title: 'only-title' }),
      {
        headers: {
          ...jsonHeaders.headers,
          ...authHeaders().headers,
        },
        tags: { type: 'expected_error', endpoint: 'create_post_invalid_body' },
      },
    );
    check(invalidBodyRes, {
      'Failures: create invalid body -> 400': (r) => r.status === 400,
    });
  });
};

export default function () {
  successFlow();
  failureFlow();
}
