import http from 'k6/http';
import { sleep, check } from 'k6';
import { authHeaders } from './helpers/auth';
import { BASE_URL, commonThresholds } from './helpers/config';

export const options = {
  vus: 20,
  duration: '1m',
  thresholds: commonThresholds,
};

export default function () {
  const res = http.get(`${BASE_URL}/posts`, authHeaders());
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
