export const MESSAGES_VALIDATION = {
    REQUIRED: 'This field is required',
    REQUIRED_EMAIL_PASSWORD: 'Email and password are required',
    INVALID_FORMAT: 'This field is invalid format',
    PASSWORD_INVALID: 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character',
    INVALID_USERNAME_PASSWORD: 'Username or password is invalid',
    INVALID_EMAIL: 'Invalid email address',
    INVALID_AUTHOR_ID: 'Invalid author ID',
    INVALID_ID_NUMBER: 'ID must be a valid number',
    INVALID_SLUG_POST: 'Slug already exists'
};

export const MESSAGES_AUTHENTICATION = {
    EXIST_USER: 'User already exists',
    USER_NOT_FOUND: 'User not found',
    INVALID_CREDENTIALS: 'Invalid credentials',
    PERMISSION_DENIED: 'Permission denied',
    ACCESS_TOKEN_EXPIRED: 'Access token expired',
    ACCESS_DENIED: 'Access denied, no access token provided',
    INTERNAL_SERVER_ERROR: 'Authentication fail',
    INVALID_TOKEN: 'Invalid token',
    INVALID_EMAIL_PASSWORD: 'Invalid email or password',
    SUCCESSFUL: 'Success',
    UN_AUTHORIZATION: 'Unauthorized'
};

export const MESSAGES = {
    BAD_REQUEST: 'Bad request',
    NOT_FOUND: 'Not found',
    SUCCESS: {
        DELETE: 'Delete success',
        UPDATE: 'Update success',
        ADD: 'Add success'
    },
    ERRORS: {
        POST: {
            USER_NOT_FOUND: 'Author not found',
            INVALID_SLUG: 'Slug must be unique',
            NOT_FOUND_OWNED_USER: "Post not found or not owned by user",
            NOT_FOUND: "Post not found"
        },
        NO_PERMISSION: 'No permission',
        COMMENT: {
            NOT_FOUND: 'Comment not found for this post',
            NOT_FOUND_COMMENT_OR_POST: 'Comment not found or Comment not found for this post'
        }
    }
};

export const REQUIRED_MESSAGE = (field: string) => `${field} is required`;
