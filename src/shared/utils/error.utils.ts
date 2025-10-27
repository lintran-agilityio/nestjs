import { HttpException } from '@nestjs/common';
import {
  IErrorResponse,
  IHandleErrorResponse,
  IHttpExceptionResponse,
} from '../interfaces';

/**
 * Handles application errors by either rethrowing HTTP exceptions or wrapping unknown errors
 *
 * @param options.error - Optional caught error
 * @param options.defaultMessage - Default message if error is not an Error instance
 * @param options.ExceptionClass - Optional custom exception class (defaults to InternalServerErrorException)
 * @throws HttpException Always throws an exception
 */
export const handleErrorException = ({
  error,
  defaultMessage,
  ExceptionClass,
}: IHandleErrorResponse): void => {
  if (error instanceof HttpException) {
    const response = error.getResponse() as IHttpExceptionResponse;
    const errorResponse: IErrorResponse = {
      message: response.message || error.message,
      error: response.error,
      status: error.getStatus(),
    };

    throw new ExceptionClass(errorResponse);
  }

  const errorResponse: IErrorResponse = {
    message: error instanceof Error ? error.message : defaultMessage,
    error: ExceptionClass.name,
    status: new ExceptionClass().getStatus(),
  };

  throw new ExceptionClass(errorResponse);
};
