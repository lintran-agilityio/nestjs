// test/loadTest/scenarios/03-user-comment-flow.test.ts
import http from "k6/http";
import { check, group } from "k6";
import { Trend } from "k6/metrics";

// test/loadTest/helpers/summary.ts
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
function handleSummaryFactory(reportBaseName) {
  return (data) => {
    const outPath = `test/loadTest/reports/${reportBaseName}-report.html`;
    return { [outPath]: htmlReport(data) };
  };
}

// test/loadTest/helpers/config.ts
var BASE_URL = __ENV.BASE_URL || "http://localhost:8080/api/v1";
var USER_EMAIL = __ENV.USER_EMAIL || "lin+01@gmail.com";
var USER_PASSWORD = __ENV.USER_PASSWORD || "Abc@1234";
var ADMIN_EMAIL = "admin@gmail.com";
var ADMIN_PASSWORD = "Admin@123";
var AUTH_PATH = __ENV.AUTH_PATH || "auth/login";
var EMAIL_FIELD = __ENV.EMAIL_FIELD || "email";
var PASSWORD_FIELD = __ENV.PASSWORD_FIELD || "password";
var TOKEN_FIELD = __ENV.TOKEN_FIELD || "accessToken";
var jsonHeaders = {
  headers: { "Content-Type": "application/json" }
};

// test/loadTest/scenarios/03-user-comment-flow.test.ts
var COMMENT_FLOW_EMAIL = ADMIN_EMAIL;
var COMMENT_FLOW_PASSWORD = ADMIN_PASSWORD;
var POSTS_PATH = "posts";
var COMMENTS_PATH = "comments";
http.setResponseCallback(
  http.expectedStatuses({ min: 200, max: 399 }, 400, 401, 403, 404, 409, 422)
);
var loginTrend = new Trend("comment_flow_login_duration");
var createPostTrend = new Trend("comment_flow_create_post_duration");
var createCommentTrend = new Trend("comment_flow_create_comment_duration");
var listCommentsTrend = new Trend("comment_flow_list_comments_duration");
var updateCommentTrend = new Trend("comment_flow_update_comment_duration");
var getCommentByIdTrend = new Trend(
  "comment_flow_get_comment_by_id_duration"
);
var deleteCommentTrend = new Trend("comment_flow_delete_comment_duration");
var options = {
  vus: 20,
  duration: "1m",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<600"],
    comment_flow_login_duration: ["p(95)<500"],
    comment_flow_create_post_duration: ["p(95)<500"],
    comment_flow_create_comment_duration: ["p(95)<500"],
    comment_flow_list_comments_duration: ["p(95)<450"],
    comment_flow_update_comment_duration: ["p(95)<500"],
    comment_flow_get_comment_by_id_duration: ["p(95)<450"],
    comment_flow_delete_comment_duration: ["p(95)<450"]
  }
};
var commentFlow = () => {
  group("User-Post-Comment Flow - end-to-end", () => {
    const loginPayload = JSON.stringify({
      [EMAIL_FIELD]: COMMENT_FLOW_EMAIL,
      [PASSWORD_FIELD]: COMMENT_FLOW_PASSWORD
    });
    const loginRes = http.post(`${BASE_URL}/${AUTH_PATH}`, loginPayload, {
      ...jsonHeaders,
      tags: { step: "login_comment_flow" }
    });
    loginTrend.add(loginRes.timings.duration);
    const loginOk = check(loginRes, {
      "login 200": (r) => r.status === 200
    });
    if (!loginOk) {
      console.error(
        `Login failed (${loginRes.status} ${loginRes.status_text}) body=${loginRes.body}`
      );
      return;
    }
    let accessToken = "";
    let userId = "";
    try {
      const loginBody = loginRes.json();
      accessToken = loginBody?.accessToken ?? "";
      userId = loginBody?.user?.id ?? "";
    } catch (error) {
      console.error("Failed to parse login response", error);
    }
    if (!accessToken || !userId) {
      console.error(
        `Missing access token or user id. token=${accessToken ? "yes" : "no"}, userId=${userId}`
      );
      return;
    }
    const authHeaders = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    };
    const uniqueId = `${__VU}-${__ITER}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const postPayload = JSON.stringify({
      slug: `slug-${uniqueId}`,
      title: `Title ${uniqueId}`,
      contents: "Hello from k6 comment flow"
    });
    const createPostRes = http.post(`${BASE_URL}/${POSTS_PATH}`, postPayload, {
      ...authHeaders,
      tags: { step: "create_post_comment_flow" }
    });
    createPostTrend.add(createPostRes.timings.duration);
    const createPostOk = check(createPostRes, {
      "create post 201": (r) => r.status === 201
    });
    if (!createPostOk) {
      console.error(
        `Create post failed (${createPostRes.status} ${createPostRes.status_text}) body=${createPostRes.body}`
      );
      return;
    }
    let postId = "";
    try {
      const postBody = createPostRes.json();
      postId = postBody?.["id"] ?? "";
    } catch (error) {
      console.error("Failed to parse create post response", error);
    }
    if (!postId) {
      console.error("Create post response missing id");
      return;
    }
    const commentPayload = JSON.stringify({
      content: "Nice post from k6!",
      postId
    });
    const createCommentRes = http.post(
      `${BASE_URL}/${COMMENTS_PATH}`,
      commentPayload,
      {
        ...authHeaders,
        tags: { step: "create_comment_comment_flow" }
      }
    );
    createCommentTrend.add(createCommentRes.timings.duration);
    const createCommentOk = check(createCommentRes, {
      "create comment 201": (r) => r.status === 201
    });
    if (!createCommentOk) {
      console.error(
        `Create comment failed (${createCommentRes.status} ${createCommentRes.status_text}) body=${createCommentRes.body}`
      );
      return;
    }
    let commentId = "";
    try {
      const commentBody = createCommentRes.json();
      commentId = commentBody?.["id"] ?? "";
    } catch (error) {
      console.error("Failed to parse create comment response", error);
    }
    if (!commentId) {
      console.error("Create comment response missing id");
      return;
    }
    const listCommentsRes = http.get(
      `${BASE_URL}/${COMMENTS_PATH}?postId=${postId}&limit=5`,
      {
        ...authHeaders,
        tags: { step: "list_comments_comment_flow" }
      }
    );
    listCommentsTrend.add(listCommentsRes.timings.duration);
    check(listCommentsRes, {
      "list comments 200": (r) => r.status === 200
    });
    const updateCommentPayload = JSON.stringify({
      content: "Updated comment from k6!"
    });
    const updateCommentRes = http.patch(
      `${BASE_URL}/${COMMENTS_PATH}/${commentId}`,
      updateCommentPayload,
      {
        ...authHeaders,
        tags: { step: "update_comment_comment_flow" }
      }
    );
    updateCommentTrend.add(updateCommentRes.timings.duration);
    const updateCommentOk = check(updateCommentRes, {
      "update comment 200": (r) => r.status === 200
    });
    if (!updateCommentOk) {
      console.error(
        `Update comment failed (${updateCommentRes.status} ${updateCommentRes.status_text}) body=${updateCommentRes.body}`
      );
    }
    const getCommentByIdRes = http.get(
      `${BASE_URL}/${COMMENTS_PATH}/${commentId}`,
      {
        ...authHeaders,
        tags: { step: "get_comment_by_id_comment_flow" }
      }
    );
    getCommentByIdTrend.add(getCommentByIdRes.timings.duration);
    const getCommentByIdOk = check(getCommentByIdRes, {
      "get comment by id 200|403": (r) => r.status === 200 || r.status === 403
    });
    if (!getCommentByIdOk && getCommentByIdRes.status !== 200) {
      console.error(
        `Get comment by id failed (${getCommentByIdRes.status} ${getCommentByIdRes.status_text}) body=${getCommentByIdRes.body}`
      );
    } else if (getCommentByIdRes.status === 403) {
      console.warn(
        "Get comment by id returned 403. Use admin credentials via COMMENT_FLOW_EMAIL/COMMENT_FLOW_PASSWORD to validate 200."
      );
    }
    const deleteCommentRes = http.del(
      `${BASE_URL}/${COMMENTS_PATH}/${commentId}`,
      null,
      {
        ...authHeaders,
        tags: { step: "delete_comment_comment_flow" }
      }
    );
    deleteCommentTrend.add(deleteCommentRes.timings.duration);
    check(deleteCommentRes, {
      "delete comment 204|200": (r) => r.status === 204 || r.status === 200
    });
  });
};
function user_comment_flow_test_default() {
  commentFlow();
}
var handleSummary = handleSummaryFactory("comment");
export {
  user_comment_flow_test_default as default,
  handleSummary,
  options
};
