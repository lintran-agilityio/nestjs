export const FIELDS_NAME = {
  EMAIL: 'email',
  PASSWORD: 'password',
  USER_NAME: 'username',
};

export const REGEX = {
  NAME: /^[a-zA-Z'-]{2,50}$/,
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PASSWORD:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/,
};

export const STATUS_CODE = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  NO_CONTENT: 204,
  CONFLICT: 409,
};

export const API_PREFIX = '/api/v1';

export const API_ENDPOINTS = {
  REGISTER: `${API_PREFIX}/auth/register`,
  LOGIN: `${API_PREFIX}/auth/login`,
  USERS: `${API_PREFIX}/users`,
  USER_BY_ID: `${API_PREFIX}/users/{userId}`,
  POSTS: `${API_PREFIX}/posts`,
  POST_BY_ID: `${API_PREFIX}/posts/:id`,
  USERS_POST_ID: `${API_PREFIX}/users/:userId/post/:id`,
  COMMENTS: `${API_PREFIX}/comments`,
  POST_COMMENTS: `${API_PREFIX}/posts/:id/comments`,
  POST_COMMENT_BY_ID: `${API_PREFIX}/posts/:id/comments/:commentId`,
  COMMENTS_DETAIL: `${API_PREFIX}/comments/:id`,
  API_DOCS: `${API_PREFIX}/api-docs`,
};

export const ROUTES = {
  BASE: '/',
};

export const PAGINATION = {
  DEFAULT: {
    LIMIT: 10,
    OFFSET: 0,
  },
  LIMIT: 10,
  OFFSET: 0,
};
