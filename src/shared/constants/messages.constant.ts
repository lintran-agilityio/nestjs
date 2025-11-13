export const MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid password!',
  PERMISSION_DEFINED: 'Permission defined',
  SERVER_ERROR: 'Internal server error',
  BAD_REQUEST: 'Bad request on your params',
  CONFLICT: 'Conflict or duplicate resource',
  NO_PERMISSION: 'You do not have permission to access this resource',
  UNAUTHORIZED: 'Your token is expire',

  // authentication
  REGISTER_FAILED: 'Create user failed',
  LOGIN_FAILED: 'User login failed',

  // user error
  USER_UNAUTHORIZED: 'Email or Password wrong!',
  USER_ALREADY_EXISTS: 'User email already exists',
  USER_NOT_FOUND: 'User not found',
  USER_CREATE_FAILED: 'Created User failed',
  USER_WRONG_PASSWORD: 'Wrong password',
  USER_INVALID_REFRESH_TOKEN: 'Invalid refresh token',
  USER_TOKEN_EXPIRED: 'Invalid or expired refresh token',
  USER_DELETE_SUCCESS: 'User has been deleted successfully',
  GET_USER_FAILED: 'Failed to get user',
  UPDATE_USER_FAILED: 'Failed to update user',
  DELETE_USER_FAILED: 'Failed to delete user',
  USER_INVALID_IDENTIFIER:
    'Invalid identifier format. Must be a valid UUID or email address.',

  // post error
  POST_NOT_FOUND: 'Post not found',
  POST_DELETE_SUCCESS: 'The Post has been deleted successfully',
  DELETE_NO_POST: 'No posts were deleted as none were found',
  POST_SLUG_IS_EXISTED: 'The post slug already exists',
  NO_POST_PROCESS: 'No posts were processed',
  GET_POST_FAILED: 'Failed to get post',
  CREATE_POST_FAILED: 'Failed for create post',
  UPDATE_POST_FAILED: 'Failed for update post',
  DELETED_POST_FAILED: 'Failed for delete post',

  // comment error
  COMMENT_NOT_FOUND: 'Comment not found',
  COMMENT_DELETE_SUCCESS: 'The Comment has been deleted successfully',
  COMMENT_CREATE_SUCCESS: 'Comment created successfully',
  COMMENT_UPDATE_SUCCESS: 'Comment updated successfully',
  COMMENT_NO_AUTHORIZED: 'You are not authorized to modify this comment',
  GET_COMMENT_FAILED: 'Failed to get comment',
  CREATE_COMMENT_FAILED: 'Failed for create comment',
  UPDATE_COMMENT_FAILED: 'Failed for update comment',
  DELETE_COMMENT_FAILED: 'Failed for delete comment',

  // validation
  INVALID_PASSWORD:
    'Password must contain at least one uppercase letter, one lowercase letter, and one special character',
  INVALID_VALIDATION: 'Validation fail',
  INVALID_TOKEN: 'Token missing or invalid',
  VALIDATION_FAILED: 'Invalid validation',
  INVALID_REQUEST_BODY: 'Invalid post body',
};
