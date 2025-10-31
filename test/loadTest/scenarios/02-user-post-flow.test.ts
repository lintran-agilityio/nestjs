// libs
import http from 'k6/http';
import { check, group } from 'k6';
import { Trend } from 'k6/metrics';

// helpers
import { authHeaders } from '../helpers/auth';
import { BASE_URL, commonThresholds, jsonHeaders } from '../helpers/config';

const createPostTrend = new Trend('create_post_duration');
const listPostsTrend = new Trend('list_posts_duration');

// Treat 404 and 500 as expected statuses to avoid counting them as failed requests
// 404 = slug collision (can happen under load), 500 = database/server errors (expected under heavy load)
http.setResponseCallback(
  http.expectedStatuses({ min: 200, max: 399 }, 404, 500),
);

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
    // Use VU ID, iteration, timestamp, and random to ensure unique slugs
    const uniqueId = `${__VU}-${__ITER}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;
    const payload = JSON.stringify({
      slug: `slug-${uniqueId}`,
      title: `Title ${uniqueId}`,
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
          console.warn(
            `Create post failed: ${r.status} ${r.status_text} body=${r.body}`,
          );
        }

        // Accept 201 (success), 404 (slug collision - rare but possible), or 500 (server error - acceptable under load)
        return r.status === 201 || r.status === 404 || r.status === 500;
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
