// libs
import http from 'k6/http';
import { check, group } from 'k6';
import { Trend } from 'k6/metrics';

// helpers
import { handleSummaryFactory } from '../helpers/summary';
import {
  AUTH_PATH,
  BASE_URL,
  EMAIL_FIELD,
  PASSWORD_FIELD,
  USER_PASSWORD,
  jsonHeaders,
} from '../helpers/config';

// Mark expected statuses so they do not inflate http_req_failed
http.setResponseCallback(
  http.expectedStatuses({ min: 200, max: 399 }, 400, 401, 403, 404, 409, 422),
);

const REGISTER_PATH = 'auth/register';
const USERS_PATH = 'users';

const loginTrend = new Trend('user_flow_login_duration');
const listUsersTrend = new Trend('user_flow_list_users_duration');
const updateUserTrend = new Trend('user_flow_update_user_duration');
const getUserByIdTrend = new Trend('user_flow_get_user_by_id_duration');
const deleteUserTrend = new Trend('user_flow_delete_user_duration');

export const options = {
  vus: 15,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<600'],
    user_flow_login_duration: ['p(95)<500'],
    user_flow_list_users_duration: ['p(95)<450'],
    user_flow_update_user_duration: ['p(95)<500'],
    user_flow_get_user_by_id_duration: ['p(95)<450'],
    user_flow_delete_user_duration: ['p(95)<450'],
  },
};

const userFlow = () => {
  group('User Flow - end-to-end', () => {
    const uniqueSuffix = `${__VU}-${__ITER}-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`;
    const email = `user-flow-${uniqueSuffix}@example.com`;

    // Register a disposable user (setup)
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
        tags: { step: 'register_user_flow' },
      },
    );

    const registerOk = check(registerRes, {
      'register user 201': (r) => r.status === 201,
    });

    if (!registerOk) {
      console.error(
        `Register failed (${registerRes.status}): ${registerRes.status_text} body=${registerRes.body}`,
      );
      return;
    }

    // Login as the newly created user
    const loginPayload = JSON.stringify({
      [EMAIL_FIELD]: email,
      [PASSWORD_FIELD]: USER_PASSWORD,
    });

    const loginRes = http.post(`${BASE_URL}/${AUTH_PATH}`, loginPayload, {
      ...jsonHeaders,
      tags: { step: 'login_user_flow' },
    });
    loginTrend.add(loginRes.timings.duration);

    const loginOk = check(loginRes, {
      'login user 200': (r) => r.status === 200,
    });

    if (!loginOk) {
      console.error(
        `Login failed (${loginRes.status}): ${loginRes.status_text} body=${loginRes.body}`,
      );
      return;
    }

    let accessToken = '';
    let userId = '';

    try {
      const loginBody = loginRes.json() as {
        accessToken?: string;
        user?: { id?: string };
      } | null;
      accessToken = loginBody?.accessToken ?? '';
      userId = loginBody?.user?.id ?? '';
    } catch (error) {
      console.error(`Failed to parse login response: ${loginRes.body}`, error);
    }

    if (!accessToken || !userId) {
      console.error(
        `Missing access token or user id from login response. token=${accessToken ? 'yes' : 'no'}, userId=${userId}`,
      );
      return;
    }

    const authHeaders = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    // Get users collection (public endpoint, optionally authenticated)
    const listRes = http.get(`${BASE_URL}/${USERS_PATH}?limit=5`, {
      ...authHeaders,
      tags: { step: 'list_users_user_flow' },
    });
    listUsersTrend.add(listRes.timings.duration);

    check(listRes, {
      'list users 200': (r) => r.status === 200,
    });

    // Update the user profile
    const updatePayload = JSON.stringify({
      firstName: `Updated${uniqueSuffix.slice(0, 6)}`,
      lastName: `User${uniqueSuffix.slice(-4)}`,
    });

    const updateRes = http.patch(
      `${BASE_URL}/${USERS_PATH}/${userId}`,
      updatePayload,
      {
        ...authHeaders,
        tags: { step: 'update_user_user_flow' },
      },
    );
    updateUserTrend.add(updateRes.timings.duration);

    const updateOk = check(updateRes, {
      'update user 200': (r) => r.status === 200,
    });

    if (!updateOk) {
      console.error(
        `Update user failed (${updateRes.status}): ${updateRes.status_text} body=${updateRes.body}`,
      );
    }

    // Fetch the updated user by id
    const getByIdRes = http.get(`${BASE_URL}/${USERS_PATH}/${userId}`, {
      ...authHeaders,
      tags: { step: 'get_user_by_id_user_flow' },
    });
    getUserByIdTrend.add(getByIdRes.timings.duration);

    check(getByIdRes, {
      'get user by id 200': (r) => r.status === 200,
      'get user reflects update': (r) => {
        if (r.status !== 200) return false;
        try {
          const body = r.json() as Record<string, unknown> | null;
          return (
            body?.['firstName'] === `Updated${uniqueSuffix.slice(0, 6)}` &&
            body?.['lastName'] === `User${uniqueSuffix.slice(-4)}`
          );
        } catch (error) {
          console.error('Failed to parse get user response', error);
          return false;
        }
      },
    });

    // Delete the user to clean up
    const deleteRes = http.del(`${BASE_URL}/${USERS_PATH}/${userId}`, null, {
      ...authHeaders,
      tags: { step: 'delete_user_user_flow' },
    });
    deleteUserTrend.add(deleteRes.timings.duration);

    check(deleteRes, {
      'delete user 204': (r) => r.status === 204,
    });
  });
};

export default function () {
  userFlow();
}

export const handleSummary = handleSummaryFactory('user-flow');
