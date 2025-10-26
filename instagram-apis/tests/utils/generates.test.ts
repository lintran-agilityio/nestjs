import 'jest';

import jwt from 'jwt-simple';
import { generateToken } from '@/utils/generates';
import { IUserResponse } from '@/types';

// Mock jwt-simple
jest.mock('jwt-simple', () => ({
  encode: jest.fn(),
  decode: jest.fn()
}));

// Mock constants
jest.mock('@/constants', () => ({
  JWT_SECRET: 'test-secret',
  JWT_EXPIRES_IN: '1h',
  JWT_REFRESH_EXPIRES_IN: '30d',
  REFRESH_TOKEN_SECRET: 'refresh-secret'
}));

// Mock config logger
jest.mock('@/configs', () => ({
  configLogger: {
    params: {
      jwtSecret: 'fallback-secret'
    }
  }
}));

describe('Generate Utils', () => {
  const mockUser: IUserResponse = {
    userId: 1,
    email: 'test@example.com',
    username: 'testuser',
    isAdmin: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('generateToken.accessToken', () => {
    it('Should generate access token with correct payload', () => {
      const mockToken = 'mock-access-token';
      (jwt.encode as jest.Mock).mockReturnValue(mockToken);

      const result = generateToken.accessToken(mockUser);

      expect(jwt.encode).toHaveBeenCalledWith(
        {
          userId: 1,
          email: 'test@example.com',
          username: 'testuser',
          isAdmin: false,
          exp: Math.floor(Date.now() / 1000) + (1 * 60 * 60) // 1 hour from now
        },
        'test-secret'
      );
      expect(result).toBe(mockToken);
    });

    it('Should return empty string when jwt.encode fails', () => {
      (jwt.encode as jest.Mock).mockReturnValue('');

      const result = generateToken.accessToken(mockUser);

      expect(result).toBe('');
    });

    it('Should calculate correct expiration time', () => {
      const mockToken = 'mock-access-token';
      (jwt.encode as jest.Mock).mockReturnValue(mockToken);

      generateToken.accessToken(mockUser);

      const expectedExp = Math.floor(Date.now() / 1000) + (1 * 60 * 60);
      expect(jwt.encode).toHaveBeenCalledWith(
        expect.objectContaining({
          exp: expectedExp
        }),
        expect.any(String)
      );
    });
  });

  describe('generateToken.refreshToken', () => {
    it('Should generate refresh token with correct payload', () => {
      const mockToken = 'mock-refresh-token';
      (jwt.encode as jest.Mock).mockReturnValue(mockToken);

      const result = generateToken.refreshToken(mockUser);

      expect(jwt.encode).toHaveBeenCalledWith(
        {
          sub: 1,
          type: 'refresh',
          exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days from now
        },
        'refresh-secret'
      );
      expect(result).toBe(mockToken);
    });

    it('Should calculate correct refresh token expiration time', () => {
      const mockToken = 'mock-refresh-token';
      (jwt.encode as jest.Mock).mockReturnValue(mockToken);

      generateToken.refreshToken(mockUser);

      const expectedExp = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
      expect(jwt.encode).toHaveBeenCalledWith(
        expect.objectContaining({
          exp: expectedExp
        }),
        expect.any(String)
      );
    });

    it('Should use correct refresh token secret', () => {
      const mockToken = 'mock-refresh-token';
      (jwt.encode as jest.Mock).mockReturnValue(mockToken);

      generateToken.refreshToken(mockUser);

      expect(jwt.encode).toHaveBeenCalledWith(
        expect.any(Object),
        'refresh-secret'
      );
    });
  });

  describe('generateToken.decodeToken', () => {
    it('Should decode token successfully', () => {
      const mockDecodedToken = {
        userId: 1,
        email: 'test@example.com',
        username: 'testuser',
        isAdmin: false,
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      const token = 'valid-token';
      (jwt.decode as jest.Mock).mockReturnValue(mockDecodedToken);

      const result = generateToken.decodeToken(token);

      expect(jwt.decode).toHaveBeenCalledWith(token, 'test-secret');
      expect(result).toEqual(mockDecodedToken);
    });

    it('Should throw error when jwt.decode fails', () => {
      const token = 'invalid-token';
      const mockError = new Error('Invalid token');
      (jwt.decode as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      expect(() => generateToken.decodeToken(token)).toThrow('Invalid token');
      expect(jwt.decode).toHaveBeenCalledWith(token, 'test-secret');
    });

    it('Should use correct JWT secret for decoding', () => {
      const token = 'valid-token';
      const mockDecodedToken = { userId: 1 };
      (jwt.decode as jest.Mock).mockReturnValue(mockDecodedToken);

      generateToken.decodeToken(token);

      expect(jwt.decode).toHaveBeenCalledWith(token, 'test-secret');
    });
  });

  describe('Edge cases', () => {
    it('Should handle user with all required fields', () => {
      const minimalUser: IUserResponse = {
        userId: 999,
        email: 'minimal@example.com',
        username: 'minimal',
        isAdmin: true
      };

      const mockToken = 'mock-token';
      (jwt.encode as jest.Mock).mockReturnValue(mockToken);

      const accessResult = generateToken.accessToken(minimalUser);
      const refreshResult = generateToken.refreshToken(minimalUser);

      expect(accessResult).toBe(mockToken);
      expect(refreshResult).toBe(mockToken);
    });

    it('Should handle different time scenarios', () => {
      // Test with different system times
      const testTimes = [
        new Date('2023-01-01T00:00:00Z'),
        new Date('2023-06-15T12:30:45Z'),
        new Date('2023-12-31T23:59:59Z')
      ];

      testTimes.forEach(testTime => {
        jest.setSystemTime(testTime);
        const mockToken = 'mock-token';
        (jwt.encode as jest.Mock).mockReturnValue(mockToken);

        const result = generateToken.accessToken(mockUser);
        expect(result).toBe(mockToken);
      });
    });
  });
});
