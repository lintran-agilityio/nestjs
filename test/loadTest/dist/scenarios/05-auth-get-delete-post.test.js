// test/loadTest/scenarios/05-auth-get-delete-post.test.ts
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

// test/loadTest/scenarios/05-auth-get-delete-post.test.ts
var REGISTER_PATH = "auth/register";
var USERS_PATH = "users";
var POSTS_PATH = "posts";
http.setResponseCallback(
  http.expectedStatuses({ min: 200, max: 399 }, 400, 401, 403, 404, 409, 422)
);
var registerTrend = new Trend("delete_flow_register_duration");
var loginTrend = new Trend("delete_flow_login_duration");
var createPostTrend = new Trend("delete_flow_create_post_duration");
var listUserPostsTrend = new Trend("delete_flow_list_user_posts_duration");
var deletePostTrend = new Trend("delete_flow_delete_post_duration");
var FLOW_PASSWORD = __ENV.DELETE_FLOW_PASSWORD || USER_PASSWORD;
var FLOW_FIRST_NAME_PREFIX = __ENV.DELETE_FLOW_FIRST_NAME_PREFIX || "Del";
var FLOW_LAST_NAME_PREFIX = __ENV.DELETE_FLOW_LAST_NAME_PREFIX || "Flow";
var FLOW_EMAIL_PREFIX = __ENV.DELETE_FLOW_EMAIL_PREFIX || "delete-flow";
var options = {
  vus: 20,
  duration: "1m",
  thresholds: {
    http_req_failed: ["rate<=0.01"],
    http_req_duration: ["p(95)<900"],
    delete_flow_register_duration: ["p(95)<1300"],
    delete_flow_login_duration: ["p(95)<900"],
    delete_flow_create_post_duration: ["p(95)<950"],
    delete_flow_list_user_posts_duration: ["p(95)<800"],
    delete_flow_delete_post_duration: ["p(95)<750"]
  }
};
var userRegisterLoginPostFlow = () => {
  group("User Register -> Login -> Post Flow", () => {
    const uniqueSuffix = `${__VU}-${__ITER}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const email = `${FLOW_EMAIL_PREFIX}-${uniqueSuffix}@example.com`;
    const registerPayload = JSON.stringify({
      email,
      password: FLOW_PASSWORD,
      firstName: `${FLOW_FIRST_NAME_PREFIX}${uniqueSuffix.slice(0, 6)}`,
      lastName: `${FLOW_LAST_NAME_PREFIX}${uniqueSuffix.slice(-4)}`
    });
    const registerRes = http.post(
      `${BASE_URL}/${REGISTER_PATH}`,
      registerPayload,
      {
        ...jsonHeaders,
        tags: { step: "register_delete_flow" }
      }
    );
    registerTrend.add(registerRes.timings.duration);
    const registerOk = check(registerRes, {
      "register user 201": (r) => r.status === 201
    });
    if (!registerOk) {
      console.error(
        `Register failed (${registerRes.status} ${registerRes.status_text}) body=${registerRes.body}`
      );
      return;
    }
    const loginPayload = JSON.stringify({
      [EMAIL_FIELD]: email,
      [PASSWORD_FIELD]: FLOW_PASSWORD
    });
    const loginRes = http.post(`${BASE_URL}/${AUTH_PATH}`, loginPayload, {
      ...jsonHeaders,
      tags: { step: "login_delete_flow" }
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
    const createPostPayload = JSON.stringify({
      slug: `slug-${uniqueSuffix}`,
      title: `Delete Flow Title ${uniqueSuffix}`,
      contents: "Hello from k6 delete flow"
    });
    const createPostRes = http.post(
      `${BASE_URL}/${POSTS_PATH}`,
      createPostPayload,
      {
        ...authHeaders,
        tags: { step: "create_post_delete_flow" }
      }
    );
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
    const listPostsRes = http.get(
      `${BASE_URL}/${USERS_PATH}/${userId}/posts?limit=5`,
      {
        ...authHeaders,
        tags: { step: "list_user_posts_delete_flow" }
      }
    );
    listUserPostsTrend.add(listPostsRes.timings.duration);
    check(listPostsRes, {
      "list user posts 200": (r) => r.status === 200
    });
    const deletePostRes = http.del(
      `${BASE_URL}/${POSTS_PATH}/${postId}`,
      null,
      {
        ...authHeaders,
        tags: { step: "delete_post_delete_flow" }
      }
    );
    deletePostTrend.add(deletePostRes.timings.duration);
    check(deletePostRes, {
      "delete post 204|200": (r) => r.status === 204 || r.status === 200
    });
  });
};
function auth_get_delete_post_test_default() {
  userRegisterLoginPostFlow();
}
var handleSummary = handleSummaryFactory("delete-post-flow");
export {
  auth_get_delete_post_test_default as default,
  handleSummary,
  options
};
