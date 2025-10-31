// libs
import http from 'k6/http';
import { check, group } from 'k6';
import { Trend } from 'k6/metrics';

import {
  AUTH_PATH,
  BASE_URL,
  EMAIL_FIELD,
  USER_EMAIL,
  USER_PASSWORD,
  PASSWORD_FIELD,
  TOKEN_FIELD,
  commonThresholds,
} from '../helpers/config';
import { getToken } from '../helpers/auth';

const loginSuccessTrend = new Trend('login_success_duration');
const loginWrongPasswordTrend = new Trend('login_wrong_password_duration');
const loginWrongEmailTrend = new Trend('login_wrong_email_duration');
const loginMissingEmailTrend = new Trend('login_missing_email_duration');
const loginMissingPasswordTrend = new Trend('login_missing_password_duration');
const loginInvalidEmailFormatTrend = new Trend(
  'login_invalid_email_format_duration',
);

export const options = {
  vus: 20,
  duration: '1m',
  thresholds: commonThresholds,
};

const login = () => {
  // Success case
  group('Auth Login - success', () => {
    const res = http.post(
      `${BASE_URL}/${AUTH_PATH}`,
      JSON.stringify({
        [EMAIL_FIELD]: USER_EMAIL,
        [PASSWORD_FIELD]: USER_PASSWORD,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );

    loginSuccessTrend.add(res.timings.duration);

    check(res, { 'Login 200': (r) => r.status === 200 });

    if (res.status !== 200) {
      throw new Error(
        `Failed to get token: ${res.status} ${res.status_text} body=${res.body}`,
      );
    }

    const body = res.json() as Record<string, string>;
    const token = body[TOKEN_FIELD];
    if (!token) {
      throw new Error(
        `Login response missing token field '${TOKEN_FIELD}': ${res.body}`,
      );
    }

    // Seed token into shared cache for helpers downstream
    getToken(token);
  });

  // Failure cases
  group('Auth Login - wrong password (400)', () => {
    const res = http.post(
      `${BASE_URL}/${AUTH_PATH}`,
      JSON.stringify({
        [EMAIL_FIELD]: USER_EMAIL,
        [PASSWORD_FIELD]: `x`,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
    loginWrongPasswordTrend.add(res.timings.duration);
    check(res, { 'Wrong password -> 400': (r) => r.status === 400 });
  });

  group('Auth Login - user not found (401)', () => {
    const res = http.post(
      `${BASE_URL}/${AUTH_PATH}`,
      JSON.stringify({
        [EMAIL_FIELD]: `nonexistent_${Date.now()}@example.com`,
        [PASSWORD_FIELD]: USER_PASSWORD,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
    loginWrongEmailTrend.add(res.timings.duration);
    check(res, { 'User not found -> 401': (r) => r.status === 401 });
  });

  group('Auth Login - missing email (400)', () => {
    const res = http.post(
      `${BASE_URL}/${AUTH_PATH}`,
      JSON.stringify({
        [PASSWORD_FIELD]: USER_PASSWORD,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
    loginMissingEmailTrend.add(res.timings.duration);
    check(res, { 'Missing email -> 400': (r) => r.status === 400 });
  });

  group('Auth Login - missing password (400)', () => {
    const res = http.post(
      `${BASE_URL}/${AUTH_PATH}`,
      JSON.stringify({
        [EMAIL_FIELD]: USER_EMAIL,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
    loginMissingPasswordTrend.add(res.timings.duration);
    check(res, { 'Missing password -> 400': (r) => r.status === 400 });
  });

  group('Auth Login - invalid email format (400)', () => {
    const res = http.post(
      `${BASE_URL}/${AUTH_PATH}`,
      JSON.stringify({
        [EMAIL_FIELD]: 'not-an-email',
        [PASSWORD_FIELD]: USER_PASSWORD,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
    loginInvalidEmailFormatTrend.add(res.timings.duration);
    check(res, { 'Invalid email -> 400': (r) => r.status === 400 });
  });
};

export default login;
