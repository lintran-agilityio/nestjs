export const COMMENTS_PAGINATION = [
  { id: 1, postId: 1, content: 'Comment 1', authorId: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 2, postId: 1, content: 'Comment 2', authorId: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export const MOCKS_COMMENTS_INCLUDE_POST_USER = [
  {
    "id": 8,
    "postId": 11,
    "authorId": 9,
    "content": "This post 8 interesting",
    "createdAt": "2025-08-07T09:34:37.732Z",
    "updatedAt": "2025-08-07T09:34:37.732Z",
    "post": {
      "id": 11,
      "title": "second Post",
      "author": {
        "userId": 8,
        "username": "lintran",
        "email": "lin+6@gm.com"
      }
    }
  }
];
