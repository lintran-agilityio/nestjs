// test/loadTest/helpers/summary.ts
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
function handleSummaryFactory(reportBaseName) {
  return (data) => {
    const outPath = `test/loadTest/reports/${reportBaseName}-report.html`;
    return { [outPath]: htmlReport(data) };
  };
}

// test/loadTest/scenarios/05-user-post-comment-delete-comment-flow.test.ts
import http from "k6/http";
import { check, group } from "k6";
import { Trend } from "k6/metrics";

// test/loadTest/helpers/config.ts
var BASE_URL = __ENV.BASE_URL || "http://localhost:8080/api/v1";
var USER_EMAIL = __ENV.USER_EMAIL || "lin+01@gmail.com";
var USER_PASSWORD = __ENV.USER_PASSWORD || "Abc@1234";
var AUTH_PATH = __ENV.AUTH_PATH || "auth/login";
var EMAIL_FIELD = __ENV.EMAIL_FIELD || "email";
var PASSWORD_FIELD = __ENV.PASSWORD_FIELD || "password";
var TOKEN_FIELD = __ENV.TOKEN_FIELD || "accessToken";
var commonThresholds = {
  http_req_failed: ["rate<0.01"],
  http_req_duration: ["p(95)<500"]
};
var jsonHeaders = {
  headers: { "Content-Type": "application/json" }
};

// test/loadTest/scenarios/05-user-post-comment-delete-comment-flow.test.ts
var cachedAccessToken = null;
var getAuthHeaders = () => {
  if (!cachedAccessToken) {
    const payload = JSON.stringify({
      [EMAIL_FIELD]: USER_EMAIL,
      [PASSWORD_FIELD]: USER_PASSWORD
    });
    const res = http.post(`${BASE_URL}/${AUTH_PATH}`, payload, {
      headers: jsonHeaders.headers
    });
    const body = res.json();
    const token = body && body[TOKEN_FIELD];
    if (res.status !== 200 || !token) {
      throw new Error(`Auth failed: ${res.status} ${res.body}`);
    }
    cachedAccessToken = token;
  }
  return { headers: { Authorization: `Bearer ${cachedAccessToken}` } };
};
var createPostTrend = new Trend("create_post_duration");
var createCommentTrend = new Trend("create_comment_duration");
var viewCommentTrend = new Trend("view_comment_duration");
var deleteCommentTrend = new Trend("delete_comment_duration");
http.setResponseCallback(
  http.expectedStatuses({ min: 200, max: 399 }, 404, 409)
);
var POSTS_PATH = "posts";
var COMMENTS_PATH = "comments";
var options = {
  vus: 20,
  duration: "1m",
  thresholds: {
    "http_req_failed{type:success}": commonThresholds.http_req_failed,
    "http_req_duration{type:success}": commonThresholds.http_req_duration,
    create_post_duration: ["p(95)<500"],
    create_comment_duration: ["p(95)<500"],
    view_comment_duration: ["p(95)<400"],
    delete_comment_duration: ["p(95)<400"]
  }
};
var successFlow = () => {
  group("User-Post-Comment-Delete Flow - success", () => {
    const postPayload = JSON.stringify({
      slug: `slug-${__VU}-${__ITER}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: `Title ${__VU}-${__ITER}-${Date.now()}`,
      contents: "Post from k6 for comment deletion flow"
    });
    const createPostRes = http.post(`${BASE_URL}/${POSTS_PATH}`, postPayload, {
      headers: { ...jsonHeaders.headers, ...getAuthHeaders().headers },
      tags: { type: "success", endpoint: "create_post" }
    });
    createPostTrend.add(createPostRes.timings.duration);
    check(createPostRes, { "create post 201": (r) => r.status === 201 });
    const postBody = createPostRes.json();
    const postId = postBody && postBody["id"];
    if (createPostRes.status !== 201 || !postId) {
      return;
    }
    const commentPayload = JSON.stringify({ content: "Nice post!", postId });
    const createCommentRes = http.post(
      `${BASE_URL}/${COMMENTS_PATH}`,
      commentPayload,
      {
        headers: { ...jsonHeaders.headers, ...getAuthHeaders().headers },
        tags: { type: "success", endpoint: "create_comment" }
      }
    );
    createCommentTrend.add(createCommentRes.timings.duration);
    check(createCommentRes, { "create comment 201": (r) => r.status === 201 });
    const commentBody = createCommentRes.json();
    const commentId = commentBody && commentBody["id"];
    if (createCommentRes.status !== 201 || !commentId) {
      return;
    }
    const viewCommentRes = http.get(
      `${BASE_URL}/${COMMENTS_PATH}/${commentId}`,
      {
        headers: { ...getAuthHeaders().headers },
        tags: { type: "success", endpoint: "view_comment" }
      }
    );
    viewCommentTrend.add(viewCommentRes.timings.duration);
    check(viewCommentRes, { "view comment 200": (r) => r.status === 200 });
    const deleteCommentRes = http.del(
      `${BASE_URL}/${COMMENTS_PATH}/${commentId}`,
      null,
      {
        headers: { ...getAuthHeaders().headers },
        tags: { type: "success", endpoint: "delete_comment" }
      }
    );
    deleteCommentTrend.add(deleteCommentRes.timings.duration);
    check(deleteCommentRes, {
      "delete comment 200": (r) => r.status === 200
    });
  });
};
var failureFlow = () => {
  group("User-Post-Comment-Delete Flow - failures", () => {
    const resCreateCommentNoToken = http.post(
      `${BASE_URL}/${COMMENTS_PATH}`,
      JSON.stringify({ content: "x", postId: "00000000-0000-0000-0000-000000000000" }),
      {
        ...jsonHeaders,
        tags: { type: "expected_error", endpoint: "create_comment_no_token" }
      }
    );
    check(resCreateCommentNoToken, {
      "Failures: create comment without token -> 401": (r) => r.status === 401
    });
    const resCreateCommentInvalid = http.post(
      `${BASE_URL}/${COMMENTS_PATH}`,
      JSON.stringify({ content: "missing-postId" }),
      {
        headers: { ...jsonHeaders.headers, ...getAuthHeaders().headers },
        tags: { type: "expected_error", endpoint: "create_comment_invalid_body" }
      }
    );
    check(resCreateCommentInvalid, {
      "Failures: create comment invalid body -> 400": (r) => r.status === 400
    });
    const resViewNotFound = http.get(
      `${BASE_URL}/${COMMENTS_PATH}/11111111-1111-1111-1111-111111111111`,
      {
        headers: { ...getAuthHeaders().headers },
        tags: { type: "expected_error", endpoint: "view_comment_not_found" }
      }
    );
    check(resViewNotFound, {
      "Failures: view non-existent comment -> 404": (r) => r.status === 404
    });
    const resDeleteNoToken = http.del(
      `${BASE_URL}/${COMMENTS_PATH}/00000000-0000-0000-0000-000000000000`
    );
    check(resDeleteNoToken, {
      "Failures: delete comment without token -> 401": (r) => r.status === 401
    });
    const resDeleteNotFound = http.del(
      `${BASE_URL}/${COMMENTS_PATH}/22222222-2222-2222-2222-222222222222`,
      null,
      {
        headers: { ...getAuthHeaders().headers },
        tags: { type: "expected_error", endpoint: "delete_comment_not_found" }
      }
    );
    check(resDeleteNotFound, {
      "Failures: delete non-existent comment -> 404|403": (r) => r.status === 404 || r.status === 403
    });
  });
};
function user_post_comment_delete_comment_flow_test_default() {
  successFlow();
  failureFlow();
}
var handleSummary = handleSummaryFactory("delete");
export {
  user_post_comment_delete_comment_flow_test_default as default,
  handleSummary,
  options
};
