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
  USER_EMAIL,
  USER_PASSWORD,
  jsonHeaders,
} from '../helpers/config';

const REGISTER_PATH = 'auth/register';
const USERS_PATH = 'users';
const POSTS_PATH = 'posts';

// Accept common 4xx/5xx responses to avoid inflating http_req_failed
http.setResponseCallback(
  http.expectedStatuses({ min: 200, max: 399 }, 400, 401, 403, 404, 409, 422),
);

const registerTrend = new Trend('delete_flow_register_duration');
const loginTrend = new Trend('delete_flow_login_duration');
const createPostTrend = new Trend('delete_flow_create_post_duration');
const listUserPostsTrend = new Trend('delete_flow_list_user_posts_duration');
const deletePostTrend = new Trend('delete_flow_delete_post_duration');

const FLOW_PASSWORD = __ENV.DELETE_FLOW_PASSWORD || USER_PASSWORD;
const FLOW_FIRST_NAME_PREFIX = __ENV.DELETE_FLOW_FIRST_NAME_PREFIX || 'Del';
const FLOW_LAST_NAME_PREFIX = __ENV.DELETE_FLOW_LAST_NAME_PREFIX || 'Flow';
const FLOW_EMAIL_PREFIX = __ENV.DELETE_FLOW_EMAIL_PREFIX || 'delete-flow';

export const options = {
  vus: 20,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<=0.01'],
    http_req_duration: ['p(95)<900'],
    delete_flow_register_duration: ['p(95)<1300'],
    delete_flow_login_duration: ['p(95)<900'],
    delete_flow_create_post_duration: ['p(95)<950'],
    delete_flow_list_user_posts_duration: ['p(95)<800'],
    delete_flow_delete_post_duration: ['p(95)<750'],
  },
};

const userRegisterLoginPostFlow = () => {
  group('User Register -> Login -> Post Flow', () => {
    const uniqueSuffix = `${__VU}-${__ITER}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;
    const email = `${FLOW_EMAIL_PREFIX}-${uniqueSuffix}@example.com`;

    const registerPayload = JSON.stringify({
      email,
      password: FLOW_PASSWORD,
      firstName: `${FLOW_FIRST_NAME_PREFIX}${uniqueSuffix.slice(0, 6)}`,
      lastName: `${FLOW_LAST_NAME_PREFIX}${uniqueSuffix.slice(-4)}`,
    });

    const registerRes = http.post(
      `${BASE_URL}/${REGISTER_PATH}`,
      registerPayload,
      {
        ...jsonHeaders,
        tags: { step: 'register_delete_flow' },
      },
    );
    registerTrend.add(registerRes.timings.duration);
    const registerOk = check(registerRes, {
      'register user 201': (r) => r.status === 201,
    });

    if (!registerOk) {
      console.error(
        `Register failed (${registerRes.status} ${registerRes.status_text}) body=${registerRes.body}`,
      );
      return;
    }

    const loginPayload = JSON.stringify({
      [EMAIL_FIELD]: email,
      [PASSWORD_FIELD]: FLOW_PASSWORD,
    });

    const loginRes = http.post(`${BASE_URL}/${AUTH_PATH}`, loginPayload, {
      ...jsonHeaders,
      tags: { step: 'login_delete_flow' },
    });
    loginTrend.add(loginRes.timings.duration);
    const loginOk = check(loginRes, {
      'login 200': (r) => r.status === 200,
    });

    if (!loginOk) {
      console.error(
        `Login failed (${loginRes.status} ${loginRes.status_text}) body=${loginRes.body}`,
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
      console.error('Failed to parse login response', error);
    }

    if (!accessToken || !userId) {
      console.error(
        `Missing access token or user id. token=${accessToken ? 'yes' : 'no'}, userId=${userId}`,
      );
      return;
    }

    const authHeaders = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    const createPostPayload = JSON.stringify({
      slug: `slug-${uniqueSuffix}`,
      title: `Delete Flow Title ${uniqueSuffix}`,
      contents: 'Hello from k6 delete flow',
    });

    const createPostRes = http.post(
      `${BASE_URL}/${POSTS_PATH}`,
      createPostPayload,
      {
        ...authHeaders,
        tags: { step: 'create_post_delete_flow' },
      },
    );
    createPostTrend.add(createPostRes.timings.duration);
    const createPostOk = check(createPostRes, {
      'create post 201': (r) => r.status === 201,
    });

    if (!createPostOk) {
      console.error(
        `Create post failed (${createPostRes.status} ${createPostRes.status_text}) body=${createPostRes.body}`,
      );
      return;
    }

    let postId = '';

    try {
      const postBody = createPostRes.json() as Record<string, unknown> | null;
      postId = (postBody?.['id'] as string) ?? '';
    } catch (error) {
      console.error('Failed to parse create post response', error);
    }

    if (!postId) {
      console.error('Create post response missing id');
      return;
    }

    const listPostsRes = http.get(
      `${BASE_URL}/${USERS_PATH}/${userId}/posts?limit=5`,
      {
        ...authHeaders,
        tags: { step: 'list_user_posts_delete_flow' },
      },
    );
    listUserPostsTrend.add(listPostsRes.timings.duration);
    check(listPostsRes, {
      'list user posts 200': (r) => r.status === 200,
    });

    const deletePostRes = http.del(
      `${BASE_URL}/${POSTS_PATH}/${postId}`,
      null,
      {
        ...authHeaders,
        tags: { step: 'delete_post_delete_flow' },
      },
    );
    deletePostTrend.add(deletePostRes.timings.duration);
    check(deletePostRes, {
      'delete post 204|200': (r) => r.status === 204 || r.status === 200,
    });
  });
};

export default function () {
  userRegisterLoginPostFlow();
}

export const handleSummary = handleSummaryFactory('delete-post-flow');
