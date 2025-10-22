import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { MESSAGES } from '../constants';
import { ISwaggerResponseOptions } from '../interfaces';
import { ErrorResponseDto } from '../dto';

// Base Decorator for successful
export const ApiOkResponseDto = ({
  summary,
  type,
  description,
  isArray,
}: ISwaggerResponseOptions) => {
  return applyDecorators(
    ApiOperation({ summary }),
    ApiResponse({
      status: HttpStatus.OK,
      description: description || 'Response successfully',
      type,
      isArray: Boolean(isArray),
    }),
    ApiBadRequestResponse({ description: MESSAGES.INVALID_VALIDATION }),
    ApiUnauthorizedResponse({
      description: MESSAGES.INVALID_TOKEN,
      type: ErrorResponseDto,
    }),
    ApiInternalServerErrorResponse({
      description: MESSAGES.SERVER_ERROR,
      type: ErrorResponseDto,
    }),
  );
};

// Base decorator for Not Found response
export const ApiNotFoundResponseDto = (message?: string) =>
  ApiNotFoundResponse({
    description: message ?? MESSAGES.USER_NOT_FOUND,
  });

// Base decorator for Bad request response
export const ApiBadRequestResponseDto = (message?: string) =>
  ApiBadRequestResponse({
    description: message ?? MESSAGES.INVALID_VALIDATION,
  });

// Base decorator for create response
export const ApiCreatedResponseDto = ({
  summary,
  type,
  description,
  isArray,
}: ISwaggerResponseOptions) => {
  return applyDecorators(
    ApiOperation({ summary }),
    ApiCreatedResponse({
      description: description ?? 'Created successfully',
      type,
      isArray: Boolean(isArray),
    }),
    ApiBadRequestResponse({
      description: MESSAGES.BAD_REQUEST,
      type: ErrorResponseDto,
    }),
    ApiConflictResponse({
      description: MESSAGES.CONFLICT,
      type: ErrorResponseDto,
    }),
    ApiInternalServerErrorResponse({
      description: MESSAGES.SERVER_ERROR,
      type: ErrorResponseDto,
    }),
  );
};

export const ApiUnauthorizedResponseDto = ({
  summary,
  description,
}: ISwaggerResponseOptions) => {
  return applyDecorators(
    ApiOperation({ summary: summary || 'Unauthorized' }),
    ApiUnauthorizedResponse({
      description: description || 'Unauthorized',
      type: ErrorResponseDto,
    }),
  );
};
