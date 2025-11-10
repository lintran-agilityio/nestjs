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
  jsonHeaders,
} from '../helpers/config';
import { getToken } from '../helpers/auth';
import { handleSummaryFactory } from '../helpers/summary';

// Mark 2xx/3xx and specific 4xx we deliberately test as expected to avoid inflating http_req_failed
http.setResponseCallback(
  http.expectedStatuses(
    { min: 200, max: 399 },
    400,
    401,
    403,
    404,
    409,
    422,
    429,
  ),
);

const REGISTER_PATH = 'auth/register';

const registerSuccessTrend = new Trend('register_success_duration');
const registerLoginSuccessTrend = new Trend('register_login_success_duration');
const loginSuccessTrend = new Trend('login_success_duration');
const loginWrongEmailTrend = new Trend('login_wrong_email_duration');
const loginMissingEmailTrend = new Trend('login_missing_email_duration');
const loginMissingPasswordTrend = new Trend('login_missing_password_duration');
const loginInvalidEmailFormatTrend = new Trend(
  'login_invalid_email_format_duration',
);

export const options = {
  vus: 20,
  duration: '1m',
  thresholds: {
    // allow up to 5% failure (since we test error cases)
    http_req_failed: ['rate<0.1'],
    // success login under 1s
    login_success_duration: ['p(95)<1800'],
    register_success_duration: ['p(95)<1800'],
    register_login_success_duration: ['p(95)<1500'],
    login_wrong_email_duration: ['p(95)<700'],
    login_missing_email_duration: ['p(95)<500'],
    login_missing_password_duration: ['p(95)<500'],
    login_invalid_email_format_duration: ['p(95)<500'],
  },
};

const registerAndLoginFlow = () => {
  group('Auth Register + Login Flow', () => {
    const uniqueSuffix = `${__VU}-${__ITER}-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`;
    const email = `auth-flow-${uniqueSuffix}@example.com`;

    const registerPayload = JSON.stringify({
      email,
      password: USER_PASSWORD,
      firstName: `Load${uniqueSuffix.slice(0, 6)}`,
      lastName: `Tester${uniqueSuffix.slice(-4)}`,
    });

    const registerRes = http.post(
      `${BASE_URL}/${REGISTER_PATH}`,
      registerPayload,
      {
        ...jsonHeaders,
        tags: { step: 'register_success' },
      },
    );

    registerSuccessTrend.add(registerRes.timings.duration);

    const registerOk = check(registerRes, {
      'Register 201': (r) => r.status === 201,
    });

    if (!registerOk) {
      console.error(
        `Register failed (${registerRes.status}): ${registerRes.status_text} body=${registerRes.body}`,
      );
      return;
    }

    const loginPayload = JSON.stringify({
      [EMAIL_FIELD]: email,
      [PASSWORD_FIELD]: USER_PASSWORD,
    });

    const loginRes = http.post(`${BASE_URL}/${AUTH_PATH}`, loginPayload, {
      ...jsonHeaders,
      tags: { step: 'login_after_register' },
    });

    registerLoginSuccessTrend.add(loginRes.timings.duration);

    const loginOk = check(loginRes, {
      'Login after register 200': (r) => r.status === 200,
    });

    if (!loginOk) {
      console.error(
        `Login after register failed (${loginRes.status}): ${loginRes.status_text} body=${loginRes.body}`,
      );
      return;
    }

    try {
      const body = loginRes.json() as Record<string, unknown> | null;
      const token =
        (body && typeof body[TOKEN_FIELD] === 'string'
          ? (body[TOKEN_FIELD] as string)
          : '') || '';

      if (!token) {
        console.error(
          `Login after register response missing token field '${TOKEN_FIELD}': ${loginRes.body}`,
        );
      } else {
        getToken(token);
      }
    } catch (error) {
      console.error(
        `Failed to parse login after register response: ${loginRes.body}`,
        error,
      );
    }
  });
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
      jsonHeaders,
    );

    loginSuccessTrend.add(res.timings.duration);

    const success = check(res, { 'Login 200': (r) => r.status === 200 });

    if (success && res.status === 200) {
      try {
        const body = res.json() as Record<string, string>;
        const token = body ? body[TOKEN_FIELD] : '';
        if (!token) {
          console.error(
            `Login response missing token field '${TOKEN_FIELD}': ${res.body}`,
          );
        } else {
          // Seed token into shared cache for helpers downstream
          getToken(token);
        }
      } catch (error) {
        console.error(`Failed to parse login response: ${res.body}`, error);
      }
    } else if (res.status !== 200) {
      // Log error but don't throw to avoid aborting the iteration
      console.error(
        `Login failed: ${res.status} ${res.status_text} body=${res.body}`,
      );
    }
  });

  // Failure cases
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

const runAuthSuite = () => {
  registerAndLoginFlow();
  login();
};

export default runAuthSuite;

// Generate HTML report when k6 finishes
export const handleSummary = handleSummaryFactory('auth');
