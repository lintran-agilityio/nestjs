import { HttpException, Type } from '@nestjs/common';

export interface ISwaggerResponseOptions {
  summary: string;
  type: Type<unknown> | string;
  description?: string;
  isArray?: boolean;
}

/**
 * Standard HTTP exception response structure used across the application
 */
export interface IHttpExceptionResponse {
  error: string;
  message: string;
}

/**
 * Extended error response that includes HTTP status code
 * Used for standardizing error responses across the application
 */
export interface IErrorResponse extends IHttpExceptionResponse {
  status: number;
}

export interface IHandleErrorResponse {
  error?: unknown;
  defaultMessage: string;
  ExceptionClass?: new (
    objectOrError?: string | object,
    description?: string,
  ) => HttpException;
}
