import http from 'k6/http';
import { sleep, check } from 'k6';
import { BASE_URL, commonThresholds } from './helpers/config';

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: commonThresholds,
};

export default function () {
  const response = http.get(`${BASE_URL}/health`);
  check(response, { 'status is 200': (res) => res.status === 200 });
  sleep(1);
}
