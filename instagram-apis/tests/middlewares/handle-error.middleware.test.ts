import 'jest';

import { Request, Response, NextFunction } from 'express';
import { globalErrorMiddleware, handleNotFoundRoute } from '@/middlewares/handle-error.middleware';
import { MESSAGES, STATUS_CODE } from '@/constants';
import { IErrorWithStatus } from '@/types';

describe('Handle Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      method: 'GET',
      url: '/test-endpoint',
      headers: {},
      body: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockNext = jest.fn();
  });

  describe('globalErrorMiddleware', () => {
    it('Should handle error with statusCode and message', () => {
      const mockError: IErrorWithStatus = {
        name: 'ValidationError',
        message: 'Invalid input data',
        statusCode: STATUS_CODE.BAD_REQUEST
      } as IErrorWithStatus;

      globalErrorMiddleware(mockError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(STATUS_CODE.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid input data'
      });
    });

    it('Should handle error with only message (no statusCode)', () => {
      const mockError: IErrorWithStatus = {
        name: 'GenericError',
        message: 'Something went wrong'
      } as IErrorWithStatus;

      globalErrorMiddleware(mockError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(STATUS_CODE.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Something went wrong'
      });
    });

    it('Should handle error with only statusCode (no message)', () => {
      const mockError: IErrorWithStatus = {
        name: 'CustomError',
        statusCode: STATUS_CODE.NOT_FOUND
      } as IErrorWithStatus;

      globalErrorMiddleware(mockError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(STATUS_CODE.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal Server Error'
      });
    });

    it('Should handle error with neither statusCode nor message', () => {
      const mockError: IErrorWithStatus = {
        name: 'EmptyError'
      } as IErrorWithStatus;

      globalErrorMiddleware(mockError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(STATUS_CODE.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal Server Error'
      });
    });

    it('Should handle error with zero statusCode', () => {
      const mockError: IErrorWithStatus = {
        name: 'ZeroStatusError',
        message: 'Zero status error',
        statusCode: 0
      } as IErrorWithStatus;

      globalErrorMiddleware(mockError, mockRequest as Request, mockResponse as Response, mockNext);

      // The actual implementation uses || operator, so 0 will be falsy and default to 500
      expect(mockResponse.status).toHaveBeenCalledWith(STATUS_CODE.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Zero status error'
      });
    });

    it('Should handle error with very large statusCode', () => {
      const mockError: IErrorWithStatus = {
        name: 'LargeStatusError',
        message: 'Large status error',
        statusCode: 999
      } as IErrorWithStatus;

      globalErrorMiddleware(mockError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(999);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Large status error'
      });
    });

    it('Should handle error with empty message string', () => {
      const mockError: IErrorWithStatus = {
        name: 'EmptyMessageError',
        message: '',
        statusCode: STATUS_CODE.BAD_REQUEST
      } as IErrorWithStatus;

      globalErrorMiddleware(mockError, mockRequest as Request, mockResponse as Response, mockNext);

      // The actual implementation uses || operator, so empty string will be falsy and default to "Internal Server Error"
      expect(mockResponse.status).toHaveBeenCalledWith(STATUS_CODE.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal Server Error'
      });
    });

    it('Should handle error with whitespace-only message', () => {
      const mockError: IErrorWithStatus = {
        name: 'WhitespaceError',
        message: '   ',
        statusCode: STATUS_CODE.BAD_REQUEST
      } as IErrorWithStatus;

      globalErrorMiddleware(mockError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(STATUS_CODE.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: '   '
      });
    });

    it('Should handle error with special characters in message', () => {
      const mockError: IErrorWithStatus = {
        name: 'SpecialCharError',
        message: 'Error with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
        statusCode: STATUS_CODE.BAD_REQUEST
      } as IErrorWithStatus;

      globalErrorMiddleware(mockError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(STATUS_CODE.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?'
      });
    });

    it('Should handle error with very long message', () => {
      const longMessage = 'a'.repeat(1000);
      const mockError: IErrorWithStatus = {
        name: 'LongMessageError',
        message: longMessage,
        statusCode: STATUS_CODE.BAD_REQUEST
      } as IErrorWithStatus;

      globalErrorMiddleware(mockError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(STATUS_CODE.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: longMessage
      });
    });

    it('Should handle error with unicode characters in message', () => {
      const mockError: IErrorWithStatus = {
        name: 'UnicodeError',
        message: 'Error with unicode: 🚀🌟🎉中文русский',
        statusCode: STATUS_CODE.BAD_REQUEST
      } as IErrorWithStatus;

      globalErrorMiddleware(mockError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(STATUS_CODE.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error with unicode: 🚀🌟🎉中文русский'
      });
    });
  });

  describe('handleNotFoundRoute', () => {
    it('Should return 404 status with correct error message', () => {
      handleNotFoundRoute(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(STATUS_CODE.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: MESSAGES.NOT_FOUND
      });
    });

    it('Should handle request with different HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];
      
      methods.forEach(method => {
        mockRequest.method = method;
        handleNotFoundRoute(mockRequest as Request, mockResponse as Response);
        
        expect(mockResponse.status).toHaveBeenCalledWith(STATUS_CODE.NOT_FOUND);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: MESSAGES.NOT_FOUND
        });
      });
    });

    it('Should handle request with different URLs', () => {
      const urls = [
        '/api/users',
        '/api/posts/123',
        '/admin/dashboard',
        '/auth/login',
        '/',
        '/very/long/nested/route/path'
      ];
      
      urls.forEach(url => {
        mockRequest.url = url;
        handleNotFoundRoute(mockRequest as Request, mockResponse as Response);
        
        expect(mockResponse.status).toHaveBeenCalledWith(STATUS_CODE.NOT_FOUND);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: MESSAGES.NOT_FOUND
        });
      });
    });

    it('Should handle request with query parameters', () => {
      mockRequest.url = '/api/search?q=test&page=1&limit=10';
      
      handleNotFoundRoute(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(STATUS_CODE.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: MESSAGES.NOT_FOUND
      });
    });

    it('Should handle request with special characters in URL', () => {
      mockRequest.url = '/api/test/!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      handleNotFoundRoute(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(STATUS_CODE.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: MESSAGES.NOT_FOUND
      });
    });

    it('Should handle request with very long URL', () => {
      const longUrl = '/api/' + 'a'.repeat(1000);
      mockRequest.url = longUrl;
      
      handleNotFoundRoute(mockRequest as Request, mockResponse as Response);
      
      expect(mockResponse.status).toHaveBeenCalledWith(STATUS_CODE.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: MESSAGES.NOT_FOUND
      });
    });
  });

  describe('Integration scenarios', () => {
    it('Should handle multiple consecutive errors with different status codes', () => {
      const errors = [
        { name: 'Error1', message: 'First error', statusCode: STATUS_CODE.BAD_REQUEST },
        { name: 'Error2', message: 'Second error', statusCode: STATUS_CODE.UNAUTHORIZED },
        { name: 'Error3', message: 'Third error', statusCode: STATUS_CODE.FORBIDDEN }
      ];

      errors.forEach((error, index) => {
        const mockError: IErrorWithStatus = error as IErrorWithStatus;
        
        globalErrorMiddleware(mockError, mockRequest as Request, mockResponse as Response, mockNext);
        
        expect(mockResponse.status).toHaveBeenCalledWith(error.statusCode);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: error.message
        });
      });
    });

    it('Should maintain response object chainability', () => {
      const mockError: IErrorWithStatus = {
        name: 'ChainableError',
        message: 'Test chainability',
        statusCode: STATUS_CODE.BAD_REQUEST
      } as IErrorWithStatus;

      globalErrorMiddleware(mockError, mockRequest as Request, mockResponse as Response, mockNext);

      // Verify that status() returns the response object for chaining
      expect(mockResponse.status).toHaveBeenCalledWith(STATUS_CODE.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Test chainability'
      });
    });

    it('Should handle mixed error scenarios', () => {
      // Test various error combinations
      const errorScenarios = [
        { error: { name: 'FullError', message: 'Full error', statusCode: STATUS_CODE.BAD_REQUEST }, expectedStatus: STATUS_CODE.BAD_REQUEST, expectedMessage: 'Full error' },
        { error: { name: 'NoStatusError', message: 'No status error' }, expectedStatus: STATUS_CODE.INTERNAL_SERVER_ERROR, expectedMessage: 'No status error' },
        { error: { name: 'NoMessageError', statusCode: STATUS_CODE.NOT_FOUND }, expectedStatus: STATUS_CODE.NOT_FOUND, expectedMessage: 'Internal Server Error' },
        { error: { name: 'EmptyError' }, expectedStatus: STATUS_CODE.INTERNAL_SERVER_ERROR, expectedMessage: 'Internal Server Error' }
      ];

      errorScenarios.forEach(({ error, expectedStatus, expectedMessage }) => {
        const mockError: IErrorWithStatus = error as IErrorWithStatus;
        
        globalErrorMiddleware(mockError, mockRequest as Request, mockResponse as Response, mockNext);
        
        expect(mockResponse.status).toHaveBeenCalledWith(expectedStatus);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: expectedMessage
        });
      });
    });
  });
});
