import { HttpException, InternalServerErrorException } from '@nestjs/common';
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
  ExceptionClass = InternalServerErrorException,
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

export const getErrorMessage = (error: unknown): string => {
  let message: string;

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (typeof error === 'object' && error !== null) {
    try {
      message = JSON.stringify(error);
    } catch {
      message = '[Unserializable error object]';
    }
  } else if (
    typeof error === 'number' ||
    typeof error === 'boolean' ||
    typeof error === 'bigint'
  ) {
    message = String(error);
  } else if (typeof error === 'symbol') {
    message = error.toString();
  } else {
    message = 'Unknown error';
  }

  return message;
};
