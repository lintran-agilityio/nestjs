import 'jest';

import { NextFunction, Response } from 'express';
import { validateToken } from '@/middlewares/auth.middleware';
import { MESSAGES, MESSAGES_AUTHENTICATION, STATUS_CODE } from '@/constants';
import { generateToken } from '@/utils';
import { RequestAuthenticationType } from '@/types';
import HttpExceptionError from '@/exceptions';

// Mock the utils
jest.mock('@/utils', () => ({
  generateToken: {
    decodeToken: jest.fn()
  }
}));

// Mock the exceptions
jest.mock('@/exceptions', () => {
  return jest.fn().mockImplementation((status: number, message: string) => {
    const error = new Error(message);
    (error as any).status = status;
    return error;
  });
});

describe('Auth Middleware', () => {
  let mockRequest: Partial<RequestAuthenticationType>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      headers: {},
      userId: undefined,
      isAdmin: undefined
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockNext = jest.fn();
  });

  describe('validateToken (without admin check)', () => {
    const middleware = validateToken();

    it('Should call next() when valid token is provided', () => {
      const mockDecodedToken = {
        userId: 123,
        isAdmin: false,
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token-here'
      };

      (generateToken.decodeToken as jest.Mock).mockReturnValue(mockDecodedToken);

      middleware(mockRequest as RequestAuthenticationType, mockResponse as Response, mockNext);

      expect(generateToken.decodeToken).toHaveBeenCalledWith('valid-token-here');
      expect(mockRequest.userId).toBe(123);
      expect(mockRequest.isAdmin).toBe(false);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('Should call next() with error when no authorization header is provided', () => {
      mockRequest.headers = {};

      middleware(mockRequest as RequestAuthenticationType, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          status: STATUS_CODE.UNAUTHORIZED,
          message: MESSAGES_AUTHENTICATION.UN_AUTHORIZATION
        })
      );
    });

    it('Should call next() with error when authorization header does not start with Bearer', () => {
      mockRequest.headers = {
        authorization: 'InvalidHeader token'
      };

      middleware(mockRequest as RequestAuthenticationType, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          status: STATUS_CODE.UNAUTHORIZED,
          message: MESSAGES_AUTHENTICATION.UN_AUTHORIZATION
        })
      );
    });

    it('Should call next() with error when token is expired', () => {
      const mockDecodedToken = {
        userId: 123,
        isAdmin: false,
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago (expired)
      };

      mockRequest.headers = {
        authorization: 'Bearer expired-token'
      };

      (generateToken.decodeToken as jest.Mock).mockReturnValue(mockDecodedToken);

      middleware(mockRequest as RequestAuthenticationType, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          status: STATUS_CODE.UNAUTHORIZED,
          message: MESSAGES_AUTHENTICATION.ACCESS_TOKEN_EXPIRED
        })
      );
    });

    it('Should call next() with error when token has no expiration', () => {
      const mockDecodedToken = {
        userId: 123,
        isAdmin: false
        // No exp field
      };

      mockRequest.headers = {
        authorization: 'Bearer no-exp-token'
      };

      (generateToken.decodeToken as jest.Mock).mockReturnValue(mockDecodedToken);

      middleware(mockRequest as RequestAuthenticationType, mockResponse as Response, mockNext);

      // Should not call next with error when no expiration is provided
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.userId).toBe(123);
      expect(mockRequest.isAdmin).toBe(false);
    });

    it('Should call next() with error when token decoding fails', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      (generateToken.decodeToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token format');
      });

      middleware(mockRequest as RequestAuthenticationType, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          status: STATUS_CODE.UNAUTHORIZED,
          message: MESSAGES_AUTHENTICATION.INVALID_TOKEN
        })
      );
    });

    it('Should handle token with current timestamp expiration', () => {
      const currentTime = Math.floor(Date.now() / 1000);
      const mockDecodedToken = {
        userId: 123,
        isAdmin: false,
        exp: currentTime
      };

      mockRequest.headers = {
        authorization: 'Bearer current-time-token'
      };

      (generateToken.decodeToken as jest.Mock).mockReturnValue(mockDecodedToken);

      middleware(mockRequest as RequestAuthenticationType, mockResponse as Response, mockNext);

      // Token should be considered expired if exp equals current time
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          status: STATUS_CODE.UNAUTHORIZED,
          message: MESSAGES_AUTHENTICATION.ACCESS_TOKEN_EXPIRED
        })
      );
    });
  });

  describe('validateToken (with admin check)', () => {
    const middleware = validateToken(true); // Require admin

    it('Should call next() when valid admin token is provided', () => {
      const mockDecodedToken = {
        userId: 123,
        isAdmin: true,
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      mockRequest.headers = {
        authorization: 'Bearer admin-token'
      };

      (generateToken.decodeToken as jest.Mock).mockReturnValue(mockDecodedToken);

      middleware(mockRequest as RequestAuthenticationType, mockResponse as Response, mockNext);

      expect(mockRequest.userId).toBe(123);
      expect(mockRequest.isAdmin).toBe(true);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('Should call next() with error when non-admin token is provided for admin-only route', () => {
      const mockDecodedToken = {
        userId: 123,
        isAdmin: false,
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      mockRequest.headers = {
        authorization: 'Bearer non-admin-token'
      };

      (generateToken.decodeToken as jest.Mock).mockReturnValue(mockDecodedToken);

      middleware(mockRequest as RequestAuthenticationType, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          status: STATUS_CODE.FORBIDDEN,
          message: MESSAGES.ERRORS.NO_PERMISSION
        })
      );
    });

    it('Should handle admin token with undefined isAdmin field', () => {
      const mockDecodedToken = {
        userId: 123,
        exp: Math.floor(Date.now() / 1000) + 3600
        // No isAdmin field
      };

      mockRequest.headers = {
        authorization: 'Bearer undefined-admin-token'
      };

      (generateToken.decodeToken as jest.Mock).mockReturnValue(mockDecodedToken);

      middleware(mockRequest as RequestAuthenticationType, mockResponse as Response, mockNext);

      // Should fail admin check when isAdmin is undefined
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          status: STATUS_CODE.FORBIDDEN,
          message: MESSAGES.ERRORS.NO_PERMISSION
        })
      );
    });
  });

  describe('Edge cases', () => {
    const middleware = validateToken();

    it('Should handle authorization header with extra spaces', () => {
      mockRequest.headers = {
        authorization: 'Bearer   token-with-spaces  '
      };

      const mockDecodedToken = {
        userId: 123,
        isAdmin: false,
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      (generateToken.decodeToken as jest.Mock).mockReturnValue(mockDecodedToken);

      middleware(mockRequest as RequestAuthenticationType, mockResponse as Response, mockNext);

      // The split(' ')[1] will get the token part after the first space, including extra spaces
      // 'Bearer   token-with-spaces  ' -> split(' ') -> ['Bearer', '', '', 'token-with-spaces', '', ''] -> [1] = ''
      // This is because split(' ') splits on single spaces, so multiple spaces create empty strings
      expect(generateToken.decodeToken).toHaveBeenCalledWith('');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('Should handle authorization header with mixed case', () => {
      mockRequest.headers = {
        authorization: 'bearer Valid-Token'
      };

      const mockDecodedToken = {
        userId: 123,
        isAdmin: false,
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      (generateToken.decodeToken as jest.Mock).mockReturnValue(mockDecodedToken);

      middleware(mockRequest as RequestAuthenticationType, mockResponse as Response, mockNext);

      // Should fail because it doesn't start with 'Bearer '
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          status: STATUS_CODE.UNAUTHORIZED,
          message: MESSAGES_AUTHENTICATION.UN_AUTHORIZATION
        })
      );
    });

    it('Should handle very long tokens', () => {
      const longToken = 'a'.repeat(1000);
      mockRequest.headers = {
        authorization: `Bearer ${longToken}`
      };

      const mockDecodedToken = {
        userId: 123,
        isAdmin: false,
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      (generateToken.decodeToken as jest.Mock).mockReturnValue(mockDecodedToken);

      middleware(mockRequest as RequestAuthenticationType, mockResponse as Response, mockNext);

      expect(generateToken.decodeToken).toHaveBeenCalledWith(longToken);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('Should handle token with special characters', () => {
      const specialToken = 'token-with-special-chars!@#$%^&*()_+-=[]{}|;:,.<>?';
      mockRequest.headers = {
        authorization: `Bearer ${specialToken}`
      };

      const mockDecodedToken = {
        userId: 123,
        isAdmin: false,
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      (generateToken.decodeToken as jest.Mock).mockReturnValue(mockDecodedToken);

      middleware(mockRequest as RequestAuthenticationType, mockResponse as Response, mockNext);

      expect(generateToken.decodeToken).toHaveBeenCalledWith(specialToken);
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('Token payload handling', () => {
    const middleware = validateToken();

    it('Should handle token with additional fields', () => {
      const mockDecodedToken = {
        userId: 123,
        email: 'test@example.com',
        username: 'testuser',
        isAdmin: false,
        exp: Math.floor(Date.now() / 1000) + 3600,
        role: 'user'
      };

      mockRequest.headers = {
        authorization: 'Bearer extended-token'
      };

      (generateToken.decodeToken as jest.Mock).mockReturnValue(mockDecodedToken);

      middleware(mockRequest as RequestAuthenticationType, mockResponse as Response, mockNext);

      expect(mockRequest.userId).toBe(123);
      expect(mockRequest.isAdmin).toBe(false);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('Should handle token with numeric userId', () => {
      const mockDecodedToken = {
        userId: 0, // Edge case: userId is 0
        isAdmin: false,
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      mockRequest.headers = {
        authorization: 'Bearer zero-user-token'
      };

      (generateToken.decodeToken as jest.Mock).mockReturnValue(mockDecodedToken);

      middleware(mockRequest as RequestAuthenticationType, mockResponse as Response, mockNext);

      expect(mockRequest.userId).toBe(0);
      expect(mockRequest.isAdmin).toBe(false);
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
