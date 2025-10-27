// Libs
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as basicAuth from 'express-basic-auth';
import {
  BadRequestException,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';

import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { handleErrorException } from './shared/utils/error.utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // enable api version
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  const configService: ConfigService = app.get<ConfigService>(ConfigService);

  // Global prefix for all routes
  const apiPrefix: string = configService.get<string>('API_PREFIX') ?? 'api';
  app.setGlobalPrefix(apiPrefix, { exclude: ['./debugging/(.*)'] });

  // CORS
  app.enableCors();

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (validationErrors = []) => {
        const messages = validationErrors.flatMap((err) =>
          Object.values(err.constraints ?? {}),
        );
        handleErrorException({
          defaultMessage: messages[0],
          ExceptionClass: BadRequestException,
        });
      },
    }),
  );

  // Swagger
  const swaggerUser: string = configService.get<string>('SWAGGER_USER') ?? '';
  const swaggerPassword: string =
    configService.get<string>('SWAGGER_PASSWORD') ?? '';

  // Only apply basic auth to swagger docs if credentials are provided
  if (swaggerUser && swaggerPassword) {
    app.use(
      [
        `/${apiPrefix}/docs`,
        `/${apiPrefix}/docs-json`,
        `/${apiPrefix}/debugging`,
      ],

      basicAuth({
        challenge: true,
        users: {
          [swaggerUser]: swaggerPassword,
        },
      }),
    );
  }

  const config = new DocumentBuilder()
    .setTitle('The NestJs Practice')
    .setDescription('The API documentation for the NestJs Practice project')
    .setVersion('1.0')
    .addBasicAuth()
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  await app.listen(process.env.PORT ?? 8080);
}

void bootstrap();
