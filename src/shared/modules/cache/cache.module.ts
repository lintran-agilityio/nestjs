// libs
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../logger/logger.service';
import Redis from 'ioredis';

import { CUSTOM_PROVIDER_TOKENS, REDIS_ENV_KEY } from '@app/shared/common';
import { RedisService } from './redis/redis.service';
import { NoOpCacheService } from './noop-cache.service';
import { CacheProvider } from '@app/shared/types';
import { CacheAbstractService } from './cache.abstract.service';

@Module({})
export class CacheModule {
  static register(
    provider: CacheProvider.REDIS | CacheProvider.MEMORY = CacheProvider.REDIS,
  ): DynamicModule {
    const providers: Provider[] = [];
    const exports: any[] = [CacheAbstractService];

    const envProvider = (process.env.CACHE_PROVIDER ?? '').toLowerCase();
    const cacheProviders = Object.values(CacheProvider) as string[];
    const normalizedEnvProvider = cacheProviders.find(
      (value) => value === envProvider,
    ) as CacheProvider;
    const isLoadTestMode = process.env.LOAD_TEST_MODE === 'true';

    const selectedProvider = isLoadTestMode
      ? CacheProvider.MEMORY
      : (normalizedEnvProvider ?? provider);

    // Cache with Redis
    if (selectedProvider === CacheProvider.REDIS) {
      providers.push(
        // Create Redis client with REDIS_CLIENT token
        {
          provide: CUSTOM_PROVIDER_TOKENS.CACHE.REDIS_CACHE_CLIENT,
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
          inject: [
            CUSTOM_PROVIDER_TOKENS.CACHE.REDIS_CACHE_CLIENT,
            AppLoggerService,
          ],
        },
        {
          provide: CacheAbstractService,
          useExisting: RedisService,
        },
      );
      exports.push(RedisService);
    } else {
      // No-op cache service when Redis is disabled
      providers.push({
        provide: CacheAbstractService,
        useClass: NoOpCacheService,
      });
    }

    // TODO:Cache with Memory

    return {
      providers,
      module: CacheModule,
      exports,
    };
  }
}
