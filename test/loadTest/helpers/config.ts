export const BASE_URL: string =
  __ENV.BASE_URL || 'http://localhost:8080/api/v1';

export const USER_EMAIL: string = __ENV.USER_EMAIL || 'lin+01@gmail.com';
export const USER_PASSWORD: string = __ENV.USER_PASSWORD || 'Abc@1234';

// Auth config (override via env to match your API)
export const AUTH_PATH: string = __ENV.AUTH_PATH || 'auth/login';
export const EMAIL_FIELD: string = __ENV.EMAIL_FIELD || 'email';
export const PASSWORD_FIELD: string = __ENV.PASSWORD_FIELD || 'password';
export const TOKEN_FIELD: string = __ENV.TOKEN_FIELD || 'accessToken';

export const commonThresholds = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<500'],
};

export const jsonHeaders = {
  headers: { 'Content-Type': 'application/json' },
};
