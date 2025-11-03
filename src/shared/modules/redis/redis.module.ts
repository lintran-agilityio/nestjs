// libs
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../logger/logger.service';
import Redis from 'ioredis';

import { CUSTOM_PROVIDER_TOKENS, REDIS_ENV_KEY } from '@app/shared/common';
import { RedisService } from './redis.service';

@Module({
  controllers: [],
  providers: [
    // Create Redis client with REDIS_CLIENT token
    {
      provide: CUSTOM_PROVIDER_TOKENS.REDIS_SERVICE,
      useFactory: (configService: ConfigService) =>
        new Redis({
          host: configService.get(REDIS_ENV_KEY.REDIS_HOST),
          port: configService.get(REDIS_ENV_KEY.REDIS_PORT),
        }),
      inject: [ConfigService],
    },
    // Inject to RedisService via token
    {
      provide: RedisService,
      useFactory: (client: Redis, appLoggerServices: AppLoggerService) =>
        new RedisService(client, appLoggerServices),
      inject: [CUSTOM_PROVIDER_TOKENS.REDIS_SERVICE, AppLoggerService],
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}
