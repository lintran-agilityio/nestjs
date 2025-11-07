// test/loadTest/scenarios/06-user-flow.test.ts
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
var AUTH_PATH = __ENV.AUTH_PATH || "auth/login";
var EMAIL_FIELD = __ENV.EMAIL_FIELD || "email";
var PASSWORD_FIELD = __ENV.PASSWORD_FIELD || "password";
var TOKEN_FIELD = __ENV.TOKEN_FIELD || "accessToken";
var jsonHeaders = {
  headers: { "Content-Type": "application/json" }
};

// test/loadTest/scenarios/06-user-flow.test.ts
http.setResponseCallback(
  http.expectedStatuses({ min: 200, max: 399 }, 400, 401, 403, 404, 409, 422)
);
var REGISTER_PATH = "auth/register";
var USERS_PATH = "users";
var loginTrend = new Trend("user_flow_login_duration");
var listUsersTrend = new Trend("user_flow_list_users_duration");
var updateUserTrend = new Trend("user_flow_update_user_duration");
var getUserByIdTrend = new Trend("user_flow_get_user_by_id_duration");
var deleteUserTrend = new Trend("user_flow_delete_user_duration");
var options = {
  vus: 15,
  duration: "1m",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<600"],
    user_flow_login_duration: ["p(95)<500"],
    user_flow_list_users_duration: ["p(95)<450"],
    user_flow_update_user_duration: ["p(95)<500"],
    user_flow_get_user_by_id_duration: ["p(95)<450"],
    user_flow_delete_user_duration: ["p(95)<450"]
  }
};
var userFlow = () => {
  group("User Flow - end-to-end", () => {
    const uniqueSuffix = `${__VU}-${__ITER}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `user-flow-${uniqueSuffix}@example.com`;
    const registerPayload = JSON.stringify({
      email,
      password: USER_PASSWORD,
      firstName: `Load${uniqueSuffix.slice(0, 6)}`,
      lastName: `Tester${uniqueSuffix.slice(-4)}`
    });
    const registerRes = http.post(
      `${BASE_URL}/${REGISTER_PATH}`,
      registerPayload,
      {
        ...jsonHeaders,
        tags: { step: "register_user_flow" }
      }
    );
    const registerOk = check(registerRes, {
      "register user 201": (r) => r.status === 201
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
    const loginRes = http.post(`${BASE_URL}/${AUTH_PATH}`, loginPayload, {
      ...jsonHeaders,
      tags: { step: "login_user_flow" }
    });
    loginTrend.add(loginRes.timings.duration);
    const loginOk = check(loginRes, {
      "login user 200": (r) => r.status === 200
    });
    if (!loginOk) {
      console.error(
        `Login failed (${loginRes.status}): ${loginRes.status_text} body=${loginRes.body}`
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
      console.error(`Failed to parse login response: ${loginRes.body}`, error);
    }
    if (!accessToken || !userId) {
      console.error(
        `Missing access token or user id from login response. token=${accessToken ? "yes" : "no"}, userId=${userId}`
      );
      return;
    }
    const authHeaders = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    };
    const listRes = http.get(`${BASE_URL}/${USERS_PATH}?limit=5`, {
      ...authHeaders,
      tags: { step: "list_users_user_flow" }
    });
    listUsersTrend.add(listRes.timings.duration);
    check(listRes, {
      "list users 200": (r) => r.status === 200
    });
    const updatePayload = JSON.stringify({
      firstName: `Updated${uniqueSuffix.slice(0, 6)}`,
      lastName: `User${uniqueSuffix.slice(-4)}`
    });
    const updateRes = http.patch(
      `${BASE_URL}/${USERS_PATH}/${userId}`,
      updatePayload,
      {
        ...authHeaders,
        tags: { step: "update_user_user_flow" }
      }
    );
    updateUserTrend.add(updateRes.timings.duration);
    const updateOk = check(updateRes, {
      "update user 200": (r) => r.status === 200
    });
    if (!updateOk) {
      console.error(
        `Update user failed (${updateRes.status}): ${updateRes.status_text} body=${updateRes.body}`
      );
    }
    const getByIdRes = http.get(`${BASE_URL}/${USERS_PATH}/${userId}`, {
      ...authHeaders,
      tags: { step: "get_user_by_id_user_flow" }
    });
    getUserByIdTrend.add(getByIdRes.timings.duration);
    check(getByIdRes, {
      "get user by id 200": (r) => r.status === 200,
      "get user reflects update": (r) => {
        if (r.status !== 200) return false;
        try {
          const body = r.json();
          return body?.["firstName"] === `Updated${uniqueSuffix.slice(0, 6)}` && body?.["lastName"] === `User${uniqueSuffix.slice(-4)}`;
        } catch (error) {
          console.error("Failed to parse get user response", error);
          return false;
        }
      }
    });
    const deleteRes = http.del(`${BASE_URL}/${USERS_PATH}/${userId}`, null, {
      ...authHeaders,
      tags: { step: "delete_user_user_flow" }
    });
    deleteUserTrend.add(deleteRes.timings.duration);
    check(deleteRes, {
      "delete user 204": (r) => r.status === 204
    });
  });
};
function user_flow_test_default() {
  userFlow();
}
var handleSummary = handleSummaryFactory("user-flow");
export {
  user_flow_test_default as default,
  handleSummary,
  options
};
