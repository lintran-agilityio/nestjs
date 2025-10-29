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
