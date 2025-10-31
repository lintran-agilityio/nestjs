// libs
import http from 'k6/http';
import {
  BASE_URL,
  USER_EMAIL,
  USER_PASSWORD,
  AUTH_PATH,
  EMAIL_FIELD,
  PASSWORD_FIELD,
  TOKEN_FIELD,
} from './config';

let cachedAccessToken: string | null = null;

export const getToken = (tokenParam?: string): string => {
  console.log('tokenParam - cachedAccessToken', tokenParam, cachedAccessToken);
  if (tokenParam) return tokenParam;
  if (cachedAccessToken) return cachedAccessToken;

  const payload = JSON.stringify({
    [EMAIL_FIELD]: USER_EMAIL,
    [PASSWORD_FIELD]: USER_PASSWORD,
  });
  const headers = { 'Content-Type': 'application/json' };
  const response = http.post(`${BASE_URL}/${AUTH_PATH}`, payload, {
    headers,
  });
  if (response.status !== 200) {
    throw new Error(
      `Failed to get token: ${response.status} ${response.status_text} body=${response.body}`,
    );
  }
  const body = response.json() as Record<string, string>;
  const token = body[TOKEN_FIELD];
  if (!token) {
    throw new Error(
      `Login response missing token field '${TOKEN_FIELD}': ${response.body}`,
    );
  }
  cachedAccessToken = token;
  return cachedAccessToken;
};

export const authHeaders = (): { headers: { Authorization: string } } => ({
  headers: { Authorization: `Bearer ${getToken()}` },
});
