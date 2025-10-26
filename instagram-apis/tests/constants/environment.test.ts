import { isTestEnvironment } from '@/constants/environment';

jest.mock('@/constants/environment', () => ({
  PORT: 3001,
  JWT_SECRET: 'mock-secret',
  REFRESH_TOKEN_SECRET: 'mock-refresh-secret',
  JWT_EXPIRES_IN: '10s',
  JWT_REFRESH_EXPIRES_IN: '1d',
  isTestEnvironment: true,
}));

describe('Environment Constants', () => {
  afterEach(() => {
    delete process.env.NODE_ENV;
  });

  it('Should return true when NODE_ENV is "test"', () => {
    process.env.NODE_ENV = 'test';
    expect(isTestEnvironment).toBe(true);
  });
});
