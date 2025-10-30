// test/loadTest/posts.loadtest.ts
import http2 from "k6/http";
import { sleep, check } from "k6";

// test/loadTest/helpers/auth.ts
import http from "k6/http";

// test/loadTest/helpers/config.ts
var BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
var USER_EMAIL = __ENV.USER_EMAIL || "lin+01@gmail.com";
var USER_PASSWORD = __ENV.USER_PASSWORD || "Abc@1234";
var AUTH_PATH = __ENV.AUTH_PATH || "/api/v1/auth/login";
var EMAIL_FIELD = __ENV.EMAIL_FIELD || "email";
var PASSWORD_FIELD = __ENV.PASSWORD_FIELD || "password";
var TOKEN_FIELD = __ENV.TOKEN_FIELD || "accessToken";
var commonThresholds = {
  http_req_failed: ["rate<0.01"],
  http_req_duration: ["p(95)<500"]
};

// test/loadTest/helpers/auth.ts
var cachedAccessToken = null;
var getToken = () => {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }
  const payload = JSON.stringify({ [EMAIL_FIELD]: USER_EMAIL, [PASSWORD_FIELD]: USER_PASSWORD });
  const headers = { "Content-Type": "application/json" };
  const response = http.post(`${BASE_URL}${AUTH_PATH}`, payload, {
    headers
  });
  if (response.status !== 200) {
    throw new Error(`Failed to get token: ${response.status} ${response.status_text} body=${response.body}`);
  }
  const body = response.json();
  const token = body[TOKEN_FIELD];
  if (!token) {
    throw new Error(`Login response missing token field '${TOKEN_FIELD}': ${response.body}`);
  }
  cachedAccessToken = token;
  return cachedAccessToken;
};
var authHeaders = () => ({
  headers: { Authorization: `Bearer ${getToken()}` }
});

// test/loadTest/posts.loadtest.ts
var options = {
  vus: 20,
  duration: "1m",
  thresholds: commonThresholds
};
function posts_loadtest_default() {
  const res = http2.get(`${BASE_URL}/posts`, authHeaders());
  check(res, { "status is 200": (r) => r.status === 200 });
  sleep(1);
}
export {
  posts_loadtest_default as default,
  options
};
