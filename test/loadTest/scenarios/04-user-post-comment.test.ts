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

const USERS_PATH = 'users';
const POSTS_PATH = 'posts';
const COMMENTS_PATH = 'comments';

const FLOW_EMAIL = __ENV.USER_POST_COMMENT_FLOW_EMAIL || USER_EMAIL;
const FLOW_PASSWORD = __ENV.USER_POST_COMMENT_FLOW_PASSWORD || USER_PASSWORD;

// Treat expected non-2xx statuses as successes to avoid skewing http_req_failed
http.setResponseCallback(
  http.expectedStatuses({ min: 200, max: 399 }, 400, 401, 403, 404, 409, 422),
);

const loginTrend = new Trend('upc_flow_login_duration');
const listUsersTrend = new Trend('upc_flow_list_users_duration');
const createPostTrend = new Trend('upc_flow_create_post_duration');
const createCommentTrend = new Trend('upc_flow_create_comment_duration');
const listCommentsTrend = new Trend('upc_flow_list_comments_duration');

export const options = {
  vus: 20,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<=0.01'],
    http_req_duration: ['p(95)<900'],
    upc_flow_login_duration: ['p(95)<900'],
    upc_flow_list_users_duration: ['p(95)<600'],
    upc_flow_create_post_duration: ['p(95)<1200'],
    upc_flow_create_comment_duration: ['p(95)<1200'],
    upc_flow_list_comments_duration: ['p(95)<650'],
  },
};

const userPostCommentFlow = () => {
  group('User-Post-Comment Flow - login + CRUD', () => {
    // Login to obtain access token and user context
    const loginPayload = JSON.stringify({
      [EMAIL_FIELD]: FLOW_EMAIL,
      [PASSWORD_FIELD]: FLOW_PASSWORD,
    });
    const loginRes = http.post(`${BASE_URL}/${AUTH_PATH}`, loginPayload, {
      ...jsonHeaders,
      tags: { step: 'login_upc_flow' },
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

    // Get users list (public endpoint; still send token to ensure auth path)
    const listUsersRes = http.get(`${BASE_URL}/${USERS_PATH}?limit=5`, {
      ...authHeaders,
      tags: { step: 'list_users_upc_flow' },
    });
    listUsersTrend.add(listUsersRes.timings.duration);

    check(listUsersRes, {
      'list users 200': (r) => r.status === 200,
    });

    // Create post owned by current user
    const uniqueId = `${__VU}-${__ITER}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;
    const createPostPayload = JSON.stringify({
      slug: `slug-${uniqueId}`,
      title: `Title ${uniqueId}`,
      contents: 'Hello from k6 UPC flow',
    });

    const createPostRes = http.post(
      `${BASE_URL}/${POSTS_PATH}`,
      createPostPayload,
      {
        ...authHeaders,
        tags: { step: 'create_post_upc_flow' },
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

    // Create a comment on the new post
    const createCommentPayload = JSON.stringify({
      content: 'Great post from k6 UPC flow! ',
      postId,
    });

    const createCommentRes = http.post(
      `${BASE_URL}/${COMMENTS_PATH}`,
      createCommentPayload,
      {
        ...authHeaders,
        tags: { step: 'create_comment_upc_flow' },
      },
    );
    createCommentTrend.add(createCommentRes.timings.duration);

    const createCommentOk = check(createCommentRes, {
      'create comment 201': (r) => r.status === 201,
    });

    if (!createCommentOk) {
      console.error(
        `Create comment failed (${createCommentRes.status} ${createCommentRes.status_text}) body=${createCommentRes.body}`,
      );
      return;
    }

    // Fetch comments for the post (ensure new comment shows up)
    const listCommentsRes = http.get(
      `${BASE_URL}/${COMMENTS_PATH}?postId=${postId}&limit=5`,
      {
        ...authHeaders,
        tags: { step: 'list_comments_upc_flow' },
      },
    );
    listCommentsTrend.add(listCommentsRes.timings.duration);

    check(listCommentsRes, {
      'list comments 200': (r) => r.status === 200,
    });
  });
};

export default function () {
  userPostCommentFlow();
}

export const handleSummary = handleSummaryFactory('user-post-comment');
