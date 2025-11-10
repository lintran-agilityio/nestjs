// test/loadTest/scenarios/01-auth.test.ts
import http2 from "k6/http";
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
var jsonHeaders = {
  headers: { "Content-Type": "application/json" }
};

// test/loadTest/helpers/auth.ts
import http from "k6/http";
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

// test/loadTest/helpers/summary.ts
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
function handleSummaryFactory(reportBaseName) {
  return (data) => {
    const outPath = `test/loadTest/reports/${reportBaseName}-report.html`;
    return { [outPath]: htmlReport(data) };
  };
}

// test/loadTest/scenarios/01-auth.test.ts
http2.setResponseCallback(
  http2.expectedStatuses(
    { min: 200, max: 399 },
    400,
    401,
    403,
    404,
    409,
    422,
    429
  )
);
var REGISTER_PATH = "auth/register";
var registerSuccessTrend = new Trend("register_success_duration");
var registerLoginSuccessTrend = new Trend("register_login_success_duration");
var loginSuccessTrend = new Trend("login_success_duration");
var loginWrongEmailTrend = new Trend("login_wrong_email_duration");
var loginMissingEmailTrend = new Trend("login_missing_email_duration");
var loginMissingPasswordTrend = new Trend("login_missing_password_duration");
var loginInvalidEmailFormatTrend = new Trend(
  "login_invalid_email_format_duration"
);
var options = {
  vus: 20,
  duration: "1m",
  thresholds: {
    // allow up to 5% failure (since we test error cases)
    http_req_failed: ["rate<0.1"],
    // success login under 1s
    login_success_duration: ["p(95)<1800"],
    register_success_duration: ["p(95)<1800"],
    register_login_success_duration: ["p(95)<1500"],
    login_wrong_email_duration: ["p(95)<700"],
    login_missing_email_duration: ["p(95)<500"],
    login_missing_password_duration: ["p(95)<500"],
    login_invalid_email_format_duration: ["p(95)<500"]
  }
};
var registerAndLoginFlow = () => {
  group("Auth Register + Login Flow", () => {
    const uniqueSuffix = `${__VU}-${__ITER}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `auth-flow-${uniqueSuffix}@example.com`;
    const registerPayload = JSON.stringify({
      email,
      password: USER_PASSWORD,
      firstName: `Load${uniqueSuffix.slice(0, 6)}`,
      lastName: `Tester${uniqueSuffix.slice(-4)}`
    });
    const registerRes = http2.post(
      `${BASE_URL}/${REGISTER_PATH}`,
      registerPayload,
      {
        ...jsonHeaders,
        tags: { step: "register_success" }
      }
    );
    registerSuccessTrend.add(registerRes.timings.duration);
    const registerOk = check(registerRes, {
      "Register 201": (r) => r.status === 201
    });
    if (!registerOk) {
      console.error(
        `Register failed (${registerRes.status}): ${registerRes.status_text} body=${registerRes.body}`
      );
      return;
    }
    const loginPayload = JSON.stringify({
      [EMAIL_FIELD]: email,
      [PASSWORD_FIELD]: USER_PASSWORD
    });
    const loginRes = http2.post(`${BASE_URL}/${AUTH_PATH}`, loginPayload, {
      ...jsonHeaders,
      tags: { step: "login_after_register" }
    });
    registerLoginSuccessTrend.add(loginRes.timings.duration);
    const loginOk = check(loginRes, {
      "Login after register 200": (r) => r.status === 200
    });
    if (!loginOk) {
      console.error(
        `Login after register failed (${loginRes.status}): ${loginRes.status_text} body=${loginRes.body}`
      );
      return;
    }
    try {
      const body = loginRes.json();
      const token = (body && typeof body[TOKEN_FIELD] === "string" ? body[TOKEN_FIELD] : "") || "";
      if (!token) {
        console.error(
          `Login after register response missing token field '${TOKEN_FIELD}': ${loginRes.body}`
        );
      } else {
        getToken(token);
      }
    } catch (error) {
      console.error(
        `Failed to parse login after register response: ${loginRes.body}`,
        error
      );
    }
  });
};
var login = () => {
  group("Auth Login - success", () => {
    const res = http2.post(
      `${BASE_URL}/${AUTH_PATH}`,
      JSON.stringify({
        [EMAIL_FIELD]: USER_EMAIL,
        [PASSWORD_FIELD]: USER_PASSWORD
      }),
      jsonHeaders
    );
    loginSuccessTrend.add(res.timings.duration);
    const success = check(res, { "Login 200": (r) => r.status === 200 });
    if (success && res.status === 200) {
      try {
        const body = res.json();
        const token = body ? body[TOKEN_FIELD] : "";
        if (!token) {
          console.error(
            `Login response missing token field '${TOKEN_FIELD}': ${res.body}`
          );
        } else {
          getToken(token);
        }
      } catch (error) {
        console.error(`Failed to parse login response: ${res.body}`, error);
      }
    } else if (res.status !== 200) {
      console.error(
        `Login failed: ${res.status} ${res.status_text} body=${res.body}`
      );
    }
  });
  group("Auth Login - user not found (401)", () => {
    const res = http2.post(
      `${BASE_URL}/${AUTH_PATH}`,
      JSON.stringify({
        [EMAIL_FIELD]: `nonexistent_${Date.now()}@example.com`,
        [PASSWORD_FIELD]: USER_PASSWORD
      }),
      { headers: { "Content-Type": "application/json" } }
    );
    loginWrongEmailTrend.add(res.timings.duration);
    check(res, { "User not found -> 401": (r) => r.status === 401 });
  });
  group("Auth Login - missing email (400)", () => {
    const res = http2.post(
      `${BASE_URL}/${AUTH_PATH}`,
      JSON.stringify({
        [PASSWORD_FIELD]: USER_PASSWORD
      }),
      { headers: { "Content-Type": "application/json" } }
    );
    loginMissingEmailTrend.add(res.timings.duration);
    check(res, { "Missing email -> 400": (r) => r.status === 400 });
  });
  group("Auth Login - missing password (400)", () => {
    const res = http2.post(
      `${BASE_URL}/${AUTH_PATH}`,
      JSON.stringify({
        [EMAIL_FIELD]: USER_EMAIL
      }),
      { headers: { "Content-Type": "application/json" } }
    );
    loginMissingPasswordTrend.add(res.timings.duration);
    check(res, { "Missing password -> 400": (r) => r.status === 400 });
  });
  group("Auth Login - invalid email format (400)", () => {
    const res = http2.post(
      `${BASE_URL}/${AUTH_PATH}`,
      JSON.stringify({
        [EMAIL_FIELD]: "not-an-email",
        [PASSWORD_FIELD]: USER_PASSWORD
      }),
      { headers: { "Content-Type": "application/json" } }
    );
    loginInvalidEmailFormatTrend.add(res.timings.duration);
    check(res, { "Invalid email -> 400": (r) => r.status === 400 });
  });
};
var runAuthSuite = () => {
  registerAndLoginFlow();
  login();
};
var auth_test_default = runAuthSuite;
var handleSummary = handleSummaryFactory("auth");
export {
  auth_test_default as default,
  handleSummary,
  options
};
