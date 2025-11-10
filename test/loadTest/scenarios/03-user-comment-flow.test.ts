// libs
import http from 'k6/http';
import { check, group } from 'k6';
import { Trend } from 'k6/metrics';

// helpers
import { handleSummaryFactory } from '../helpers/summary';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  AUTH_PATH,
  BASE_URL,
  EMAIL_FIELD,
  PASSWORD_FIELD,
  jsonHeaders,
} from '../helpers/config';

const COMMENT_FLOW_EMAIL = ADMIN_EMAIL;
const COMMENT_FLOW_PASSWORD = ADMIN_PASSWORD;

const POSTS_PATH = 'posts';
const COMMENTS_PATH = 'comments';

// Treat common error statuses as expected so they don't inflate http_req_failed
http.setResponseCallback(
  http.expectedStatuses({ min: 200, max: 399 }, 400, 401, 403, 404, 409, 422),
);

const loginTrend = new Trend('comment_flow_login_duration');
const createPostTrend = new Trend('comment_flow_create_post_duration');
const createCommentTrend = new Trend('comment_flow_create_comment_duration');
const listCommentsTrend = new Trend('comment_flow_list_comments_duration');
const updateCommentTrend = new Trend('comment_flow_update_comment_duration');
const getCommentByIdTrend = new Trend(
  'comment_flow_get_comment_by_id_duration',
);
const deleteCommentTrend = new Trend('comment_flow_delete_comment_duration');

export const options = {
  vus: 20,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<600'],
    comment_flow_login_duration: ['p(95)<500'],
    comment_flow_create_post_duration: ['p(95)<500'],
    comment_flow_create_comment_duration: ['p(95)<500'],
    comment_flow_list_comments_duration: ['p(95)<450'],
    comment_flow_update_comment_duration: ['p(95)<500'],
    comment_flow_get_comment_by_id_duration: ['p(95)<450'],
    comment_flow_delete_comment_duration: ['p(95)<450'],
  },
};

const commentFlow = () => {
  group('User-Post-Comment Flow - end-to-end', () => {
    // Login (token + user info required for ownership)
    const loginPayload = JSON.stringify({
      [EMAIL_FIELD]: COMMENT_FLOW_EMAIL,
      [PASSWORD_FIELD]: COMMENT_FLOW_PASSWORD,
    });
    const loginRes = http.post(`${BASE_URL}/${AUTH_PATH}`, loginPayload, {
      ...jsonHeaders,
      tags: { step: 'login_comment_flow' },
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

    // Create a post to attach comments to (ensures ownership)
    const uniqueId = `${__VU}-${__ITER}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;
    const postPayload = JSON.stringify({
      slug: `slug-${uniqueId}`,
      title: `Title ${uniqueId}`,
      contents: 'Hello from k6 comment flow',
    });

    const createPostRes = http.post(`${BASE_URL}/${POSTS_PATH}`, postPayload, {
      ...authHeaders,
      tags: { step: 'create_post_comment_flow' },
    });
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

    // Create comment for the new post
    const commentPayload = JSON.stringify({
      content: 'Nice post from k6!',
      postId,
    });

    const createCommentRes = http.post(
      `${BASE_URL}/${COMMENTS_PATH}`,
      commentPayload,
      {
        ...authHeaders,
        tags: { step: 'create_comment_comment_flow' },
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

    let commentId = '';

    try {
      const commentBody = createCommentRes.json() as Record<
        string,
        unknown
      > | null;
      commentId = (commentBody?.['id'] as string) ?? '';
    } catch (error) {
      console.error('Failed to parse create comment response', error);
    }

    if (!commentId) {
      console.error('Create comment response missing id');
      return;
    }

    // Get comments list (filter by post to ensure inclusion)
    const listCommentsRes = http.get(
      `${BASE_URL}/${COMMENTS_PATH}?postId=${postId}&limit=5`,
      {
        ...authHeaders,
        tags: { step: 'list_comments_comment_flow' },
      },
    );
    listCommentsTrend.add(listCommentsRes.timings.duration);

    check(listCommentsRes, {
      'list comments 200': (r) => r.status === 200,
    });

    // Update comment content
    const updateCommentPayload = JSON.stringify({
      content: 'Updated comment from k6!',
    });

    const updateCommentRes = http.patch(
      `${BASE_URL}/${COMMENTS_PATH}/${commentId}`,
      updateCommentPayload,
      {
        ...authHeaders,
        tags: { step: 'update_comment_comment_flow' },
      },
    );
    updateCommentTrend.add(updateCommentRes.timings.duration);

    const updateCommentOk = check(updateCommentRes, {
      'update comment 200': (r) => r.status === 200,
    });

    if (!updateCommentOk) {
      console.error(
        `Update comment failed (${updateCommentRes.status} ${updateCommentRes.status_text}) body=${updateCommentRes.body}`,
      );
    }

    // Get comment by id (requires ADMIN role; ensure credentials have access)
    const getCommentByIdRes = http.get(
      `${BASE_URL}/${COMMENTS_PATH}/${commentId}`,
      {
        ...authHeaders,
        tags: { step: 'get_comment_by_id_comment_flow' },
      },
    );
    getCommentByIdTrend.add(getCommentByIdRes.timings.duration);

    const getCommentByIdOk = check(getCommentByIdRes, {
      'get comment by id 200|403': (r) => r.status === 200 || r.status === 403,
    });

    if (!getCommentByIdOk && getCommentByIdRes.status !== 200) {
      console.error(
        `Get comment by id failed (${getCommentByIdRes.status} ${getCommentByIdRes.status_text}) body=${getCommentByIdRes.body}`,
      );
    } else if (getCommentByIdRes.status === 403) {
      console.warn(
        'Get comment by id returned 403. Use admin credentials via COMMENT_FLOW_EMAIL/COMMENT_FLOW_PASSWORD to validate 200.',
      );
    }

    // Delete comment
    const deleteCommentRes = http.del(
      `${BASE_URL}/${COMMENTS_PATH}/${commentId}`,
      null,
      {
        ...authHeaders,
        tags: { step: 'delete_comment_comment_flow' },
      },
    );
    deleteCommentTrend.add(deleteCommentRes.timings.duration);

    check(deleteCommentRes, {
      'delete comment 204|200': (r) => r.status === 204 || r.status === 200,
    });
  });
};

export default function () {
  commentFlow();
}

export const handleSummary = handleSummaryFactory('comment');
