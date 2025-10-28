import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL, commonThresholds } from './helpers/config';
import { AUTH_PATH, EMAIL_FIELD, PASSWORD_FIELD } from './helpers/config';

const loginTrend = new Trend('login_duration');
const createPostTrend = new Trend('create_post_duration');
const getPostsTrend = new Trend('get_posts_duration');

export const options = {
  vus: 10,
  duration: '1m',
  thresholds: commonThresholds,
};

export default function () {
  const loginRes = http.post(
    `${BASE_URL}${AUTH_PATH}`,
    JSON.stringify({
      [EMAIL_FIELD]: 'lin+01@gmail.com',
      [PASSWORD_FIELD]: 'Abc@1234',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );

  loginTrend.add(loginRes.timings.duration);

  check(loginRes, {
    'Login status is 200': (r) => r.status === 200,
  });

  const token = (loginRes.json() as Record<string, string>)['accessToken'];
  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  // create Post
  const createPostRes = http.post(
    `${BASE_URL}/api/v1/posts`,
    JSON.stringify({
      title: `Load test post ${Math.random()}`,
      contents: 'This post create from k6',
      slug: `post-${Math.random()}`,
    }),
    authHeaders,
  );

  createPostTrend.add(createPostRes.timings.duration);

  check(createPostRes, {
    'Create Post status is 201: ': (r) => r.status === 201,
  });

  // get Posts
  const getPostRes = http.get(`${BASE_URL}/api/v1/posts`, authHeaders);

  getPostsTrend.add(getPostRes.timings.duration);

  check(getPostRes, {
    'Get Post status is 200: ': (r) => r.status === 200,
  });

  // sleep 1s before continue new loop
  sleep(1);
}
