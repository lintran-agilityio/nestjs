import http from 'k6/http';
import { sleep, check } from 'k6';
import { BASE_URL, commonThresholds } from './helpers/config';
import { authHeaders } from './helpers/auth';

export const options = {
  thresholds: commonThresholds,
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  const res = http.get(`${BASE_URL}/posts`, authHeaders());
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
