// test/loadTest/helpers/summary.ts
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
function handleSummaryFactory(reportBaseName) {
  return (data) => {
    const outPath = `test/loadTest/reports/${reportBaseName}-report.html`;
    return { [outPath]: htmlReport(data) };
  };
}

// test/loadTest/scenarios/03-user-post-comment-flow.test.ts
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

// test/loadTest/scenarios/03-user-post-comment-flow.test.ts
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
var viewPostTrend = new Trend("view_post_duration");
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
    view_post_duration: ["p(95)<400"]
  }
};
var successFlow = () => {
  group("User-Post-Comment Flow - success", () => {
    const postPayload = JSON.stringify({
      slug: `slug-${__VU}-${__ITER}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: `Title ${__VU}-${__ITER}-${Date.now()}`,
      contents: "Hello from k6 post"
    });
    const createPostRes = http.post(`${BASE_URL}/${POSTS_PATH}`, postPayload, {
      headers: {
        ...jsonHeaders.headers,
        ...getAuthHeaders().headers
      },
      tags: { type: "success", endpoint: "create_post" }
    });
    createPostTrend.add(createPostRes.timings.duration);
    check(createPostRes, { "create post 201": (r) => r.status === 201 });
    const postBody = createPostRes.json();
    const postId = postBody && postBody["id"];
    if (createPostRes.status !== 201 || !postId) {
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
        headers: {
          ...jsonHeaders.headers,
          ...getAuthHeaders().headers
        },
        tags: { type: "success", endpoint: "create_comment" }
      }
    );
    createCommentTrend.add(createCommentRes.timings.duration);
    check(createCommentRes, { "create comment 201": (r) => r.status === 201 });
    const viewRes = http.get(`${BASE_URL}/${POSTS_PATH}/${postId}`, {
      headers: {
        ...getAuthHeaders().headers
      },
      tags: { type: "success", endpoint: "view_post" }
    });
    viewPostTrend.add(viewRes.timings.duration);
    check(viewRes, { "view post 200": (r) => r.status === 200 });
  });
};
var failureFlow = () => {
  group("User-Post-Comment Flow - failures", () => {
    const badPostRes = http.post(
      `${BASE_URL}/${POSTS_PATH}`,
      JSON.stringify({ slug: "a", title: "b", contents: "c" }),
      {
        ...jsonHeaders,
        tags: { type: "expected_error", endpoint: "create_post_no_token" }
      }
    );
    check(badPostRes, {
      "Failures: create post without token -> 401": (r) => r.status === 401
    });
    const badCommentRes = http.post(
      `${BASE_URL}/${COMMENTS_PATH}`,
      JSON.stringify({
        content: "x",
        postId: "00000000-0000-0000-0000-000000000000"
      }),
      {
        ...jsonHeaders,
        tags: { type: "expected_error", endpoint: "create_comment_no_token" }
      }
    );
    check(badCommentRes, {
      "Failures: create comment without token -> 401": (r) => r.status === 401
    });
    const invalidPostRes = http.post(
      `${BASE_URL}/${POSTS_PATH}`,
      JSON.stringify({ title: "only-title" }),
      {
        headers: {
          ...jsonHeaders.headers,
          ...getAuthHeaders().headers
        },
        tags: { type: "expected_error", endpoint: "create_post_invalid_body" }
      }
    );
    check(invalidPostRes, {
      "Failures: create post invalid body -> 400": (r) => r.status === 400
    });
    const invalidCommentRes = http.post(
      `${BASE_URL}/${COMMENTS_PATH}`,
      JSON.stringify({ content: "missing-postId" }),
      {
        headers: {
          ...jsonHeaders.headers,
          ...getAuthHeaders().headers
        },
        tags: {
          type: "expected_error",
          endpoint: "create_comment_invalid_body"
        }
      }
    );
    check(invalidCommentRes, {
      "Failures: create comment invalid body -> 400": (r) => r.status === 400
    });
  });
};
function user_post_comment_flow_test_default() {
  successFlow();
  failureFlow();
}
var handleSummary = handleSummaryFactory("comment");
export {
  user_post_comment_flow_test_default as default,
  handleSummary,
  options
};
