// test/loadTest/smoke.ts
import http from "k6/http";
import { sleep, check } from "k6";

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

// test/loadTest/smoke.ts
var options = {
  vus: 5,
  duration: "30s",
  thresholds: commonThresholds
};
function smoke_default() {
  const response = http.get(`${BASE_URL}/health`);
  check(response, { "status is 200": (res) => res.status === 200 });
  sleep(1);
}
export {
  smoke_default as default,
  options
};
