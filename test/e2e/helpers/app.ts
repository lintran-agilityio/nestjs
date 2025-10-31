import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';

export const API_PREFIX = 'api';
export const API_VERSION_PREFIX = 'v';
export const DEFAULT_API_VERSION = '1';

export const configureApp = (app: INestApplication): void => {
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: DEFAULT_API_VERSION,
    prefix: API_VERSION_PREFIX,
  });
  app.setGlobalPrefix(API_PREFIX, { exclude: ['./debugging/(.*)'] });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
};

export const url = (path: string): string => {
  return `/${API_PREFIX}/${API_VERSION_PREFIX}${DEFAULT_API_VERSION}/${path.replace(/^\//, '')}`;
};

/**
 * Helper comment for mocking error.utils in e2e tests:
 * Due to Jest hoisting behavior, the mock must be defined inline.
 * Use this pattern in your test files:
 *
 * ```typescript
 * jest.mock('@app/shared/utils/error.utils', () => ({
 *   handleErrorException: jest.fn((args = {}) => {
 *     const { ExceptionClass, defaultMessage } = args;
 *     if (ExceptionClass) {
 *       throw new ExceptionClass(defaultMessage ?? 'Validation error');
 *     }
 *     throw new Error(defaultMessage ?? 'Validation error');
 *   }),
 * }));
 * ```
 */
