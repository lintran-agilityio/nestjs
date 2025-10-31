// test/loadTest/user-post-flow.loadtest.ts
import http from "k6/http";
import { check, sleep } from "k6";
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

// src/shared/constants/path.constant.ts
var PATHS = {
  AUTH: "auth",
  USERS: "users",
  POSTS: "posts",
  COMMENTS: "comments"
};

// test/loadTest/user-post-flow.loadtest.ts
var loginTrend = new Trend("login_duration");
var createPostTrend = new Trend("create_post_duration");
var getPostsTrend = new Trend("get_posts_duration");
var options = {
  vus: 10,
  duration: "1m",
  thresholds: commonThresholds
};
function user_post_flow_loadtest_default() {
  const loginRes = http.post(
    `${BASE_URL}/${AUTH_PATH}`,
    JSON.stringify({
      [EMAIL_FIELD]: "lin+01@gmail.com",
      [PASSWORD_FIELD]: "Abc@1234"
    }),
    {
      headers: { "Content-Type": "application/json" }
    }
  );
  loginTrend.add(loginRes.timings.duration);
  check(loginRes, {
    "Login status is 200": (r) => r.status === 200
  });
  const token = loginRes.json()["accessToken"];
  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  };
  const createPostRes = http.post(
    `${BASE_URL}/${PATHS.POSTS}`,
    JSON.stringify({
      title: `Load test post ${Math.random()}`,
      contents: "This post create from k6",
      slug: `post-${Math.random()}`
    }),
    authHeaders
  );
  createPostTrend.add(createPostRes.timings.duration);
  check(createPostRes, {
    "Create Post status is 201: ": (r) => r.status === 201
  });
  const getPostRes = http.get(`${BASE_URL}/${PATHS.POSTS}`, authHeaders);
  getPostsTrend.add(getPostRes.timings.duration);
  check(getPostRes, {
    "Get Post status is 200: ": (r) => r.status === 200
  });
  sleep(1);
}
export {
  user_post_flow_loadtest_default as default,
  options
};
