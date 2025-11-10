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

// Mark expected statuses to avoid counting intentional 4xx/5xx as failures
http.setResponseCallback(
  http.expectedStatuses({ min: 200, max: 399 }, 400, 401, 403, 404, 409, 422),
);

const POSTS_PATH = 'posts';
const USER_POSTS_PATH = 'users';

const loginTrend = new Trend('post_flow_login_duration');
const createPostTrend = new Trend('post_flow_createPost_duration');
const listPostsTrend = new Trend('post_flow_listPosts_duration');
const updatePostTrend = new Trend('post_flow_updatePost_duration');
const getUserPostsTrend = new Trend('post_flow_getUserPosts_duration');
const deletePostTrend = new Trend('post_flow_deletePost_duration');

export const options = {
  vus: 20,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<600'],
    post_flow_login_duration: ['p(95)<500'],
    post_flow_createPost_duration: ['p(95)<500'],
    post_flow_listPosts_duration: ['p(95)<450'],
    post_flow_updatePost_duration: ['p(95)<500'],
    post_flow_getUserPosts_duration: ['p(95)<450'],
    post_flow_deletePost_duration: ['p(95)<450'],
  },
};

const userPostFlow = () => {
  group('User-Post Flow - end-to-end', () => {
    // Authenticate to obtain token and user context
    const loginPayload = JSON.stringify({
      [EMAIL_FIELD]: USER_EMAIL,
      [PASSWORD_FIELD]: USER_PASSWORD,
    });
    const loginRes = http.post(`${BASE_URL}/${AUTH_PATH}`, loginPayload, {
      ...jsonHeaders,
      tags: { step: 'login_post_flow' },
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

    // Create a fresh post to operate on
    const uniqueId = `${__VU}-${__ITER}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;
    const createPayload = JSON.stringify({
      slug: `slug-${uniqueId}`,
      title: `Title ${uniqueId}`,
      contents: 'Hello from k6 post flow',
    });

    const createRes = http.post(`${BASE_URL}/${POSTS_PATH}`, createPayload, {
      ...authHeaders,
      tags: { step: 'create_post_post_flow' },
    });
    createPostTrend.add(createRes.timings.duration);

    const createOk = check(createRes, {
      'create post 201': (r) => r.status === 201,
    });

    if (!createOk) {
      console.error(
        `Create post failed (${createRes.status} ${createRes.status_text}) body=${createRes.body}`,
      );
      return;
    }

    let postId = '';

    try {
      const body = createRes.json() as Record<string, unknown> | null;
      postId = (body?.['id'] as string) ?? '';
    } catch (error) {
      console.error('Failed to parse create post response', error);
    }

    if (!postId) {
      console.error('Create post response missing id');
      return;
    }

    // Get posts list
    const listRes = http.get(`${BASE_URL}/${POSTS_PATH}?limit=5`, {
      ...authHeaders,
      tags: { step: 'list_posts_post_flow' },
    });
    listPostsTrend.add(listRes.timings.duration);

    check(listRes, {
      'list posts 200': (r) => r.status === 200,
    });

    // Update the post
    const updatePayload = JSON.stringify({
      slug: `slug-${uniqueId}`,
      title: `Updated Title ${uniqueId}`,
      contents: 'Updated content from k6 post flow',
    });

    const updateRes = http.patch(
      `${BASE_URL}/${POSTS_PATH}/${postId}`,
      updatePayload,
      {
        ...authHeaders,
        tags: { step: 'update_post_post_flow' },
      },
    );
    updatePostTrend.add(updateRes.timings.duration);

    const updateOk = check(updateRes, {
      'update post 200': (r) => r.status === 200,
    });

    if (!updateOk) {
      console.error(
        `Update post failed (${updateRes.status} ${updateRes.status_text}) body=${updateRes.body}`,
      );
    }

    // Get user posts for current user
    const userPostsRes = http.get(
      `${BASE_URL}/${USER_POSTS_PATH}/${userId}/posts?limit=5`,
      {
        ...authHeaders,
        tags: { step: 'get_user_posts_post_flow' },
      },
    );
    getUserPostsTrend.add(userPostsRes.timings.duration);

    check(userPostsRes, {
      'get user posts 200': (r) => r.status === 200,
    });

    // Delete the post
    const deleteRes = http.del(`${BASE_URL}/${POSTS_PATH}/${postId}`, null, {
      ...authHeaders,
      tags: { step: 'delete_post_post_flow' },
    });
    deletePostTrend.add(deleteRes.timings.duration);

    check(deleteRes, {
      'delete post 204|200': (r) => r.status === 204 || r.status === 200,
    });
  });
};

export default function () {
  userPostFlow();
}

export const handleSummary = handleSummaryFactory('post');
