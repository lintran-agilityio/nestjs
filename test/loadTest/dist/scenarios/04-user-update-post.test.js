// test/loadTest/scenarios/04-user-update-post.test.ts
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

// test/loadTest/scenarios/04-user-update-post.test.ts
var viewPostBeforeTrend = new Trend("view_post_before_duration");
var updatePostTrend = new Trend("update_post_duration");
var viewPostAfterTrend = new Trend("view_post_after_duration");
http.setResponseCallback(
  http.expectedStatuses({ min: 200, max: 399 }, 403, 404, 409)
);
var POSTS_PATH = "posts";
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
var options = {
  vus: 20,
  duration: "1m",
  thresholds: {
    "http_req_failed{type:success}": commonThresholds.http_req_failed,
    "http_req_duration{type:success}": commonThresholds.http_req_duration,
    view_post_before_duration: ["p(95)<400"],
    update_post_duration: ["p(95)<500"],
    view_post_after_duration: ["p(95)<400"]
  }
};
var successFlow = () => {
  group("User-Update-Post Flow - success", () => {
    const postPayload = JSON.stringify({
      slug: `slug-${__VU}-${__ITER}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: `Title ${__VU}-${__ITER}-${Date.now()}`,
      contents: "Original content from k6"
    });
    const createRes = http.post(`${BASE_URL}/${POSTS_PATH}`, postPayload, {
      headers: {
        ...jsonHeaders.headers,
        ...getAuthHeaders().headers
      },
      tags: { type: "success", endpoint: "create_post" }
    });
    check(createRes, { "create post 201 (setup)": (r) => r.status === 201 });
    const body = createRes.json();
    const postId = body && body["id"];
    const createdSlug = body && body["slug"];
    if (createRes.status !== 201 || !postId) {
      return;
    }
    const viewBeforeRes = http.get(`${BASE_URL}/${POSTS_PATH}/${postId}`, {
      headers: { ...getAuthHeaders().headers },
      tags: { type: "success", endpoint: "view_post_before" }
    });
    viewPostBeforeTrend.add(viewBeforeRes.timings.duration);
    check(viewBeforeRes, { "view post before 200": (r) => r.status === 200 });
    const updatePayload = JSON.stringify({
      slug: createdSlug,
      title: `Updated Title ${__VU}-${__ITER}`,
      contents: "Updated content from k6"
    });
    const updateRes = http.patch(
      `${BASE_URL}/${POSTS_PATH}/${postId}`,
      updatePayload,
      {
        headers: {
          ...jsonHeaders.headers,
          ...getAuthHeaders().headers
        },
        tags: { type: "success", endpoint: "update_post" }
      }
    );
    updatePostTrend.add(updateRes.timings.duration);
    check(updateRes, {
      "update post 200|403": (r) => r.status === 200 || r.status === 403
    });
    const viewAfterRes = http.get(`${BASE_URL}/${POSTS_PATH}/${postId}`, {
      headers: { ...getAuthHeaders().headers },
      tags: { type: "success", endpoint: "view_post_after" }
    });
    viewPostAfterTrend.add(viewAfterRes.timings.duration);
    check(viewAfterRes, { "view post after 200": (r) => r.status === 200 });
  });
};
var failureFlow = () => {
  group("User-Update-Post Flow - failures", () => {
    const resNoToken = http.patch(
      `${BASE_URL}/${POSTS_PATH}/00000000-0000-0000-0000-000000000000`,
      JSON.stringify({ slug: "x", title: "y", contents: "z" }),
      {
        ...jsonHeaders,
        tags: { type: "expected_error", endpoint: "update_post_no_token" }
      }
    );
    check(resNoToken, {
      "Failures: update without token -> 401": (r) => r.status === 401
    });
    const setupCreate = http.post(
      `${BASE_URL}/${POSTS_PATH}`,
      JSON.stringify({
        slug: `slug-inv-${__VU}-${__ITER}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: `Title inv ${__VU}-${__ITER}`,
        contents: "content inv"
      }),
      {
        headers: { ...jsonHeaders.headers, ...getAuthHeaders().headers },
        tags: { type: "success", endpoint: "view_post_update" }
      }
    );
    const setupBody = setupCreate.json();
    const setupId = setupBody && setupBody["id"];
    if (setupCreate.status === 201 && setupId) {
      const invalidBodyRes = http.patch(
        `${BASE_URL}/${POSTS_PATH}/${setupId}`,
        JSON.stringify({ title: "only-title" }),
        {
          headers: {
            ...jsonHeaders.headers,
            ...getAuthHeaders().headers
          },
          tags: {
            type: "expected_error",
            endpoint: "update_post_invalid_body"
          }
        }
      );
      check(invalidBodyRes, {
        "Failures: update invalid body -> 400|422|403": (r) => r.status === 400 || r.status === 422 || r.status === 403
      });
    }
    const notFoundRes = http.patch(
      `${BASE_URL}/${POSTS_PATH}/11111111-1111-1111-1111-111111111111`,
      JSON.stringify({ slug: "a", title: "b", contents: "c" }),
      {
        headers: {
          ...jsonHeaders.headers,
          ...getAuthHeaders().headers
        },
        tags: { type: "expected_error", endpoint: "update_post_not_found" }
      }
    );
    check(notFoundRes, {
      "Failures: update non-existent -> 404|403": (r) => r.status === 404 || r.status === 403
    });
  });
};
function user_update_post_test_default() {
  successFlow();
  failureFlow();
}
export {
  user_update_post_test_default as default,
  options
};
