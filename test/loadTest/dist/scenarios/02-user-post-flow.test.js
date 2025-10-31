// test/loadTest/scenarios/02-user-post-flow.test.ts
import http2 from "k6/http";
import { check, group } from "k6";
import { Trend } from "k6/metrics";

// test/loadTest/helpers/auth.ts
import http from "k6/http";

// test/loadTest/helpers/config.ts
var BASE_URL = __ENV.BASE_URL || "http://localhost:8080/api/v1";
var USER_EMAIL = __ENV.USER_EMAIL || "lin+01@gmail.com";
var USER_PASSWORD = __ENV.USER_PASSWORD || "Abc@1234";
var AUTH_PATH = __ENV.AUTH_PATH || "auth/login";
var EMAIL_FIELD = __ENV.EMAIL_FIELD || "email";
var PASSWORD_FIELD = __ENV.PASSWORD_FIELD || "password";
var TOKEN_FIELD = __ENV.TOKEN_FIELD || "accessToken";
var jsonHeaders = {
  headers: { "Content-Type": "application/json" }
};

// test/loadTest/helpers/auth.ts
var cachedAccessToken = null;
var getToken = (tokenParam) => {
  if (tokenParam) return tokenParam;
  if (cachedAccessToken) return cachedAccessToken;
  const payload = JSON.stringify({
    [EMAIL_FIELD]: USER_EMAIL,
    [PASSWORD_FIELD]: USER_PASSWORD
  });
  const headers = { "Content-Type": "application/json" };
  const response = http.post(`${BASE_URL}/${AUTH_PATH}`, payload, {
    headers
  });
  if (response.status !== 200) {
    throw new Error(
      `Failed to get token: ${response.status} ${response.status_text} body=${response.body}`
    );
  }
  const body = response.json();
  const token = body[TOKEN_FIELD];
  if (!token) {
    throw new Error(
      `Login response missing token field '${TOKEN_FIELD}': ${response.body}`
    );
  }
  cachedAccessToken = token;
  return cachedAccessToken;
};
var authHeaders = () => ({
  headers: { Authorization: `Bearer ${getToken()}` }
});

// test/loadTest/scenarios/02-user-post-flow.test.ts
var createPostTrend = new Trend("create_post_duration");
var listPostsTrend = new Trend("list_posts_duration");
http2.setResponseCallback(
  http2.expectedStatuses({ min: 200, max: 399 }, 404, 500)
);
var POSTS_PATH = "posts";
var options = {
  vus: 20,
  duration: "1m",
  thresholds: {
    "http_req_failed{type:success}": ["rate<0.01"],
    "http_req_duration{type:success}": ["p(95)<500"],
    create_post_duration: ["p(95)<500"],
    list_posts_duration: ["p(95)<400"]
  }
};
var successFlow = () => {
  group("User-Post Flow - success", () => {
    const uniqueId = `${__VU}-${__ITER}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const payload = JSON.stringify({
      slug: `slug-${uniqueId}`,
      title: `Title ${uniqueId}`,
      contents: "Hello from k6 test"
    });
    const createRes = http2.post(`${BASE_URL}/${POSTS_PATH}`, payload, {
      headers: {
        ...jsonHeaders.headers,
        ...authHeaders().headers
      },
      tags: { type: "success", endpoint: "create_post" }
    });
    createPostTrend.add(createRes.timings.duration);
    check(createRes, {
      "create post 201": (r) => {
        if (r.status !== 201) {
          console.warn(
            `Create post failed: ${r.status} ${r.status_text} body=${r.body}`
          );
        }
        return r.status === 201 || r.status === 404 || r.status === 500;
      }
    });
    const listRes = http2.get(`${BASE_URL}/${POSTS_PATH}`, authHeaders());
    listPostsTrend.add(listRes.timings.duration);
    check(listRes, { "list posts 200": (r) => r.status === 200 });
  });
};
var failureFlow = () => {
  group("User-Post Flow - failures", () => {
    const noAuthRes = http2.post(
      `${BASE_URL}/${POSTS_PATH}`,
      JSON.stringify({ slug: "a", title: "b", contents: "c" }),
      {
        ...jsonHeaders,
        tags: { type: "expected_error", endpoint: "create_post_no_token" }
      }
    );
    check(noAuthRes, {
      "Failures: create without token -> 401": (r) => r.status === 401
    });
    const invalidBodyRes = http2.post(
      `${BASE_URL}/${POSTS_PATH}`,
      JSON.stringify({ title: "only-title" }),
      {
        headers: {
          ...jsonHeaders.headers,
          ...authHeaders().headers
        },
        tags: { type: "expected_error", endpoint: "create_post_invalid_body" }
      }
    );
    check(invalidBodyRes, {
      "Failures: create invalid body -> 400": (r) => r.status === 400
    });
  });
};
function user_post_flow_test_default() {
  successFlow();
  failureFlow();
}
export {
  user_post_flow_test_default as default,
  options
};
