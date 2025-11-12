export const TTL_CACHE = {
  REFRESH_TOKEN: 7 * 24 * 60 * 60,
  USERS_LIST: 60, // seconds
  USER_BY_ID: 60 * 5, // seconds
  USER_BY_EMAIL: 60 * 5, // seconds
  POSTS_LIST: 60, // seconds
  POST_BY_ID: 60 * 5, // seconds
  POST_BY_SLUG: 60 * 5, // seconds
  COMMENTS_LIST: 60, // seconds
  COMMENT_BY_ID: 60 * 5, // seconds
};

export const REDIS_CACHE_KEYS = {
  REFRESH_TOKEN: 'refresh',
  USERS: {
    LIST: 'users:list',
    BY_ID: 'users:byId',
    BY_EMAIL: 'users:email',
  },
  POSTS: {
    LIST: 'posts:list',
    BY_ID: 'posts:byId',
    BY_SLUG: 'posts:slug',
  },
  COMMENTS: {
    LIST: 'comments:list',
    BY_ID: 'comments:byId',
  },
};
