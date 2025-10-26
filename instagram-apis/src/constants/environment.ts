// libs
import 'dotenv/config';

export const PORT = process.env.PORT || 3001;
export const JWT_SECRET = process.env.JWT_SECRET || 'jwt-secret';
export const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET || 'jwt-refresh-token-secret';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRED_TIME || '1h';
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRED_TIME || '30d';

export const isTestEnvironment = process.env.NODE_ENV === 'test';
