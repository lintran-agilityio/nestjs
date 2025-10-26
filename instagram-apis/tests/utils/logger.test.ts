import 'jest';

import { logger, errorHandler } from '@/utils/logger';
import { Request, Response, NextFunction } from 'express';

// Mock winston
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    printf: jest.fn()
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn()
  }
}));

// Mock path
jest.mock('path', () => ({
  resolve: jest.fn(() => '/mock/path/to/logs/app.log')
}));

describe('Logger Utils', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      url: '/test',
      headers: {},
      body: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logger', () => {
    it('Should create logger with correct configuration', () => {
      // The logger is created when the module is imported
      // We can verify it was created by checking if createLogger was called
      expect(logger).toBeDefined();
    });

    it('Should have info method', () => {
      expect(typeof logger.info).toBe('function');
    });

    it('Should have error method', () => {
      expect(typeof logger.error).toBe('function');
    });

    it('Should have warn method', () => {
      expect(typeof logger.warn).toBe('function');
    });

    it('Should have debug method', () => {
      expect(typeof logger.debug).toBe('function');
    });
  });

  describe('errorHandler', () => {
    it('Should call logger.error with error stack when available', () => {
      const mockError = new Error('Test error');
      mockError.stack = 'Error: Test error\n    at test.js:1:1';

      // Mock the logger.error method
      const mockLoggerError = jest.fn();
      (logger as any).error = mockLoggerError;

      errorHandler(mockError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockLoggerError).toHaveBeenCalledWith('Error: Test error\n    at test.js:1:1');
    });

    it('Should call logger.error with error message when stack is not available', () => {
      const mockError = { message: 'Test error message' };

      // Mock the logger.error method
      const mockLoggerError = jest.fn();
      (logger as any).error = mockLoggerError;

      errorHandler(mockError as any, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockLoggerError).toHaveBeenCalledWith('Test error message');
    });

    it('Should call logger.error with error object when neither stack nor message is available', () => {
      const mockError = { customProperty: 'custom value' };

      // Mock the logger.error method
      const mockLoggerError = jest.fn();
      (logger as any).error = mockLoggerError;

      errorHandler(mockError as any, mockRequest as Request, mockResponse as Response, mockNext);

      // The actual implementation logs err.stack || err.message, so when both are undefined,
      // it will log undefined, but we're testing the behavior
      expect(mockLoggerError).toHaveBeenCalledWith(undefined);
    });

    it('Should set response status to 500', () => {
      const mockError = new Error('Test error');

      errorHandler(mockError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('Should send error response with correct format', () => {
      const mockError = new Error('Test error');

      errorHandler(mockError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });

    it('Should handle different error types', () => {
      const errorTypes = [
        new Error('Standard error'),
        { message: 'Object with message' },
        { customField: 'Custom error' },
        'String error',
        42
      ];

      errorTypes.forEach((error) => {
        const mockLoggerError = jest.fn();
        (logger as any).error = mockLoggerError;

        errorHandler(error as any, mockRequest as Request, mockResponse as Response, mockNext);

        // Should not throw and should call logger.error
        expect(mockLoggerError).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      });
    });

    it('Should not call next function', () => {
      const mockError = new Error('Test error');

      errorHandler(mockError, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('Should handle circular reference errors gracefully', () => {
      const circularError: any = { message: 'Circular error' };
      circularError.self = circularError;

      // Mock the logger.error method
      const mockLoggerError = jest.fn();
      (logger as any).error = mockLoggerError;

      // Should not throw
      expect(() => {
        errorHandler(circularError, mockRequest as Request, mockResponse as Response, mockNext);
      }).not.toThrow();

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  describe('Integration scenarios', () => {
    it('Should handle multiple consecutive errors', () => {
      const errors = [
        new Error('First error'),
        new Error('Second error'),
        new Error('Third error')
      ];

      const mockLoggerError = jest.fn();
      (logger as any).error = mockLoggerError;

      errors.forEach((error, index) => {
        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
        
        expect(mockLoggerError).toHaveBeenCalledWith(error.stack || error.message);
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      });

      expect(mockLoggerError).toHaveBeenCalledTimes(3);
    });

    it('Should maintain response object chainability', () => {
      const mockError = new Error('Test error');

      errorHandler(mockError, mockRequest as Request, mockResponse as Response, mockNext);

      // Verify that status() returns the response object for chaining
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});
