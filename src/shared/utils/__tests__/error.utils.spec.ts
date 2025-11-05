import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { MESSAGES } from '../../constants/messages.constant';
import { IErrorResponse } from '../../interfaces';
import { handleErrorException, getErrorMessage } from '../error.utils';

describe('Error Utils', () => {
  describe('handleErrorException', () => {
    describe('when error is an HttpException instance', () => {
      it('should preserve original error message and status from HttpException', () => {
        const originalError = new BadRequestException(MESSAGES.BAD_REQUEST);

        expect(() => {
          handleErrorException({
            error: originalError,
            defaultMessage: MESSAGES.SERVER_ERROR,
            ExceptionClass: InternalServerErrorException,
          });
        }).toThrow(InternalServerErrorException);

        try {
          handleErrorException({
            error: originalError,
            defaultMessage: MESSAGES.SERVER_ERROR,
            ExceptionClass: InternalServerErrorException,
          });
        } catch (thrownError) {
          expect(thrownError).toBeInstanceOf(InternalServerErrorException);
          const response = (
            thrownError as InternalServerErrorException
          ).getResponse() as IErrorResponse;
          expect(response.message).toBe(MESSAGES.BAD_REQUEST);
          expect(response.status).toBe(400);
        }
      });

      it('should use custom error message from HttpException response', () => {
        const originalError = new UnauthorizedException({
          message: MESSAGES.UNAUTHORIZED,
          error: 'Unauthorized',
        });

        try {
          handleErrorException({
            error: originalError,
            defaultMessage: MESSAGES.SERVER_ERROR,
            ExceptionClass: UnauthorizedException,
          });
        } catch (thrownError) {
          expect(thrownError).toBeInstanceOf(UnauthorizedException);
          const response = (
            thrownError as UnauthorizedException
          ).getResponse() as IErrorResponse;
          expect(response.message).toBe(MESSAGES.UNAUTHORIZED);
          expect(response.error).toBe('Unauthorized');
          expect(response.status).toBe(401);
        }
      });

      it('should fallback to error.message when response.message is falsy', () => {
        const originalError = new BadRequestException('Fallback message');
        // Mock getResponse to return object without message
        jest.spyOn(originalError, 'getResponse').mockReturnValue({
          error: 'Bad Request',
        } as any);

        try {
          handleErrorException({
            error: originalError,
            defaultMessage: MESSAGES.SERVER_ERROR,
            ExceptionClass: BadRequestException,
          });
        } catch (thrownError) {
          expect(thrownError).toBeInstanceOf(BadRequestException);
          const response = (
            thrownError as BadRequestException
          ).getResponse() as IErrorResponse;
          expect(response.message).toBe('Fallback message');
          expect(response.status).toBe(400);
        }
      });

      it('should handle NotFoundException with correct status', () => {
        const originalError = new NotFoundException(MESSAGES.POST_NOT_FOUND);

        try {
          handleErrorException({
            error: originalError,
            defaultMessage: MESSAGES.SERVER_ERROR,
            ExceptionClass: NotFoundException,
          });
        } catch (thrownError) {
          expect(thrownError).toBeInstanceOf(NotFoundException);
          const response = (
            thrownError as NotFoundException
          ).getResponse() as IErrorResponse;
          expect(response.message).toBe(MESSAGES.POST_NOT_FOUND);
          expect(response.status).toBe(404);
        }
      });

      it('should preserve error details from ForbiddenException', () => {
        const originalError = new ForbiddenException(MESSAGES.NO_PERMISSION);

        try {
          handleErrorException({
            error: originalError,
            defaultMessage: MESSAGES.SERVER_ERROR,
            ExceptionClass: ForbiddenException,
          });
        } catch (thrownError) {
          expect(thrownError).toBeInstanceOf(ForbiddenException);
          const response = (
            thrownError as ForbiddenException
          ).getResponse() as IErrorResponse;
          expect(response.message).toBe(MESSAGES.NO_PERMISSION);
          expect(response.status).toBe(403);
        }
      });
    });

    describe('when error is an Error instance', () => {
      it('should wrap regular Error with BadRequestException', () => {
        const regularError = new Error(MESSAGES.INVALID_CREDENTIALS);

        try {
          handleErrorException({
            error: regularError,
            defaultMessage: MESSAGES.SERVER_ERROR,
            ExceptionClass: BadRequestException,
          });
        } catch (thrownError) {
          expect(thrownError).toBeInstanceOf(BadRequestException);
          const response = (
            thrownError as BadRequestException
          ).getResponse() as IErrorResponse;
          expect(response.message).toBe(MESSAGES.INVALID_CREDENTIALS);
          expect(response.error).toBe('BadRequestException');
          expect(response.status).toBe(400);
        }
      });

      it('should wrap regular Error with UnauthorizedException', () => {
        const regularError = new Error(MESSAGES.USER_UNAUTHORIZED);

        try {
          handleErrorException({
            error: regularError,
            defaultMessage: MESSAGES.SERVER_ERROR,
            ExceptionClass: UnauthorizedException,
          });
        } catch (thrownError) {
          expect(thrownError).toBeInstanceOf(UnauthorizedException);
          const response = (
            thrownError as UnauthorizedException
          ).getResponse() as IErrorResponse;
          expect(response.message).toBe(MESSAGES.USER_UNAUTHORIZED);
          expect(response.status).toBe(401);
        }
      });

      it('should work with different ExceptionClass types', () => {
        const testCases = [
          {
            ExceptionClass: NotFoundException,
            expectedStatus: 404,
            message: MESSAGES.POST_NOT_FOUND,
          },
          {
            ExceptionClass: ForbiddenException,
            expectedStatus: 403,
            message: MESSAGES.NO_PERMISSION,
          },
          {
            ExceptionClass: InternalServerErrorException,
            expectedStatus: 500,
            message: MESSAGES.SERVER_ERROR,
          },
        ];

        testCases.forEach(({ ExceptionClass, expectedStatus, message }) => {
          const regularError = new Error(message);

          try {
            handleErrorException({
              error: regularError,
              defaultMessage: MESSAGES.SERVER_ERROR,
              ExceptionClass,
            });
            fail('Should have thrown an exception');
          } catch (thrownError) {
            expect(thrownError).toBeInstanceOf(ExceptionClass);
            const response = (
              thrownError as HttpException
            ).getResponse() as IErrorResponse;
            expect(response.status).toBe(expectedStatus);
            expect(response.error).toBe(ExceptionClass.name);
          }
        });
      });

      it('should use default ExceptionClass when not provided', () => {
        const regularError = new Error('Some error');

        try {
          handleErrorException({
            error: regularError,
            defaultMessage: MESSAGES.SERVER_ERROR,
          });
        } catch (thrownError) {
          expect(thrownError).toBeInstanceOf(InternalServerErrorException);
          const response = (
            thrownError as InternalServerErrorException
          ).getResponse() as IErrorResponse;
          expect(response.message).toBe('Some error');
          expect(response.status).toBe(500);
          expect(response.error).toBe('InternalServerErrorException');
        }
      });
    });

    describe('when error is not an Error instance', () => {
      it('should use defaultMessage when error is undefined', () => {
        try {
          handleErrorException({
            error: undefined,
            defaultMessage: MESSAGES.SERVER_ERROR,
            ExceptionClass: InternalServerErrorException,
          });
        } catch (thrownError) {
          expect(thrownError).toBeInstanceOf(InternalServerErrorException);
          const response = (
            thrownError as InternalServerErrorException
          ).getResponse() as IErrorResponse;
          expect(response.message).toBe(MESSAGES.SERVER_ERROR);
          expect(response.status).toBe(500);
        }
      });

      it('should use defaultMessage when error is null', () => {
        try {
          handleErrorException({
            error: null,
            defaultMessage: MESSAGES.GET_USER_FAILED,
            ExceptionClass: InternalServerErrorException,
          });
        } catch (thrownError) {
          expect(thrownError).toBeInstanceOf(InternalServerErrorException);
          const response = (
            thrownError as InternalServerErrorException
          ).getResponse() as IErrorResponse;
          expect(response.message).toBe(MESSAGES.GET_USER_FAILED);
        }
      });

      it('should use defaultMessage when error is any other type', () => {
        const testCases = [
          { value: 'String error', message: MESSAGES.BAD_REQUEST },
          { value: { code: 'ERR001' }, message: MESSAGES.SERVER_ERROR },
          { value: ['error1'], message: MESSAGES.INVALID_VALIDATION },
        ];

        testCases.forEach(({ value, message }) => {
          try {
            handleErrorException({
              error: value,
              defaultMessage: message,
              ExceptionClass: BadRequestException,
            });
            fail('Should have thrown an exception');
          } catch (thrownError) {
            expect(thrownError).toBeInstanceOf(BadRequestException);
            const response = (
              thrownError as BadRequestException
            ).getResponse() as IErrorResponse;
            expect(response.message).toBe(message);
          }
        });
      });
    });

    describe('edge cases', () => {
      it('should always throw an exception', () => {
        expect(() => {
          handleErrorException({
            error: undefined,
            defaultMessage: MESSAGES.SERVER_ERROR,
            ExceptionClass: BadRequestException,
          });
        }).toThrow();
      });

      it('should correctly set error property to ExceptionClass name', () => {
        try {
          handleErrorException({
            error: undefined,
            defaultMessage: MESSAGES.UNAUTHORIZED,
            ExceptionClass: ForbiddenException,
          });
        } catch (thrownError) {
          const response = (
            thrownError as ForbiddenException
          ).getResponse() as IErrorResponse;
          expect(response.error).toBe('ForbiddenException');
          expect(response.message).toBe(MESSAGES.UNAUTHORIZED);
        }
      });
    });

    describe('integration scenarios', () => {
      it('should handle user not found scenario', () => {
        const notFoundError = new NotFoundException(MESSAGES.USER_NOT_FOUND);

        try {
          handleErrorException({
            error: notFoundError,
            defaultMessage: MESSAGES.SERVER_ERROR,
            ExceptionClass: NotFoundException,
          });
        } catch (thrownError) {
          expect(thrownError).toBeInstanceOf(NotFoundException);
          const response = (
            thrownError as NotFoundException
          ).getResponse() as IErrorResponse;
          expect(response.message).toBe(MESSAGES.USER_NOT_FOUND);
          expect(response.status).toBe(404);
        }
      });

      it('should handle user unauthorized scenario', () => {
        const authError = new UnauthorizedException(MESSAGES.USER_UNAUTHORIZED);

        try {
          handleErrorException({
            error: authError,
            defaultMessage: MESSAGES.SERVER_ERROR,
            ExceptionClass: UnauthorizedException,
          });
        } catch (thrownError) {
          expect(thrownError).toBeInstanceOf(UnauthorizedException);
          const response = (
            thrownError as UnauthorizedException
          ).getResponse() as IErrorResponse;
          expect(response.message).toBe(MESSAGES.USER_UNAUTHORIZED);
          expect(response.status).toBe(401);
        }
      });

      it('should handle generic database error scenario', () => {
        const dbError = new Error(MESSAGES.SERVER_ERROR);

        try {
          handleErrorException({
            error: dbError,
            defaultMessage: MESSAGES.SERVER_ERROR,
            ExceptionClass: InternalServerErrorException,
          });
        } catch (thrownError) {
          expect(thrownError).toBeInstanceOf(InternalServerErrorException);
          const response = (
            thrownError as InternalServerErrorException
          ).getResponse() as IErrorResponse;
          expect(response.message).toBe(MESSAGES.SERVER_ERROR);
          expect(response.status).toBe(500);
        }
      });

      it('should handle comment not found scenario', () => {
        const notFoundError = new NotFoundException(MESSAGES.COMMENT_NOT_FOUND);

        try {
          handleErrorException({
            error: notFoundError,
            defaultMessage: MESSAGES.SERVER_ERROR,
            ExceptionClass: NotFoundException,
          });
        } catch (thrownError) {
          expect(thrownError).toBeInstanceOf(NotFoundException);
          const response = (
            thrownError as NotFoundException
          ).getResponse() as IErrorResponse;
          expect(response.message).toBe(MESSAGES.COMMENT_NOT_FOUND);
        }
      });
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error instance', () => {
      const error = new Error('Test error message');
      expect(getErrorMessage(error)).toBe('Test error message');
    });

    it('should return string when error is a string', () => {
      expect(getErrorMessage('String error message')).toBe(
        'String error message',
      );
      expect(getErrorMessage('')).toBe('');
    });

    it('should stringify serializable object errors', () => {
      const errorObj = { code: 'ERR001', message: 'Object error' };
      const result = getErrorMessage(errorObj);
      expect(result).toBe(JSON.stringify(errorObj));
    });

    it('should return "Unknown error" for null', () => {
      expect(getErrorMessage(null)).toBe('Unknown error');
    });

    it('should handle array objects', () => {
      const errorArray = ['error1', 'error2'];
      expect(getErrorMessage(errorArray)).toBe(JSON.stringify(errorArray));
    });

    it('should handle nested objects', () => {
      const nestedObj = {
        error: {
          code: 500,
          message: 'Nested error',
        },
      };
      expect(getErrorMessage(nestedObj)).toBe(JSON.stringify(nestedObj));
    });

    it('should handle unserializable objects (circular reference)', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj; // Create circular reference

      const result = getErrorMessage(circularObj);
      expect(result).toBe('[Unserializable error object]');
    });

    it('should handle unserializable objects (with toJSON that throws)', () => {
      const problematicObj: any = {
        name: 'test',
        toJSON: () => {
          throw new Error('Cannot serialize');
        },
      };

      const result = getErrorMessage(problematicObj);
      expect(result).toBe('[Unserializable error object]');
    });

    it('should convert number errors to string', () => {
      expect(getErrorMessage(404)).toBe('404');
      expect(getErrorMessage(0)).toBe('0');
      expect(getErrorMessage(-1)).toBe('-1');
      expect(getErrorMessage(3.14)).toBe('3.14');
      expect(getErrorMessage(Number.MAX_SAFE_INTEGER)).toBe(
        String(Number.MAX_SAFE_INTEGER),
      );
    });

    it('should convert boolean errors to string', () => {
      expect(getErrorMessage(true)).toBe('true');
      expect(getErrorMessage(false)).toBe('false');
    });

    it('should convert bigint errors to string', () => {
      const bigIntValue = BigInt(9007199254740991);
      expect(getErrorMessage(bigIntValue)).toBe('9007199254740991');
      expect(getErrorMessage(BigInt(0))).toBe('0');
      expect(getErrorMessage(BigInt(-1))).toBe('-1');
    });

    it('should convert symbol errors to string', () => {
      const sym = Symbol('test symbol');
      expect(getErrorMessage(sym)).toBe(sym.toString());
    });

    it('should return "Unknown error" for undefined', () => {
      expect(getErrorMessage(undefined)).toBe('Unknown error');
    });

    it('should return "Unknown error" for unsupported types', () => {
      // Function type
      expect(getErrorMessage(() => {})).toBe('Unknown error');
    });

    it('should handle complex nested unserializable objects', () => {
      const complexObj: any = {
        level1: {
          level2: {
            level3: {},
          },
        },
      };
      complexObj.level1.level2.level3.circular = complexObj;

      const result = getErrorMessage(complexObj);
      expect(result).toBe('[Unserializable error object]');
    });

    it('should handle objects with special values', () => {
      const specialObj = {
        nullVal: null,
        undefinedVal: undefined,
        nanVal: NaN,
        infinityVal: Infinity,
      };
      const result = getErrorMessage(specialObj);
      expect(result).toContain('nullVal');
      expect(result).toContain('null');
    });

    it('should handle Date objects', () => {
      const date = new Date('2023-01-01');
      const result = getErrorMessage(date);
      expect(result).toBe(JSON.stringify(date));
    });

    it('should handle Map objects', () => {
      const mapObj = new Map([
        ['key1', 'value1'],
        ['key2', 'value2'],
      ]);
      const result = getErrorMessage(mapObj);
      // Maps serialize to empty object in JSON.stringify
      expect(result).toBe('{}');
    });

    it('should handle Set objects', () => {
      const setObj = new Set([1, 2, 3]);
      const result = getErrorMessage(setObj);
      // Sets serialize to empty object in JSON.stringify
      expect(result).toBe('{}');
    });
  });
});
