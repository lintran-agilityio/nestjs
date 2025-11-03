// libs
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import { AppLoggerService } from '../../logger/logger.service';
import { CacheAbstractService } from '../cache.abstract.service';
import { getErrorMessage } from '@app/shared/utils/error.utils';

@Injectable()
export class RedisService extends CacheAbstractService {
  private readonly client: Redis;

  // Inject token into redisService
  constructor(client: Redis, appLoggerServices: AppLoggerService) {
    // Create context name for logger
    const logger = appLoggerServices.getLoggerName(RedisService.name);

    super(logger);

    this.client = client;
  }

  async checkRedisConnection(): Promise<string> {
    try {
      // Test connection by setting and getting a temporary key
      const testKey = 'test:connection';
      await this.client.set(testKey, 'ok', 'EX', 60);
      const result = await this.client.get(testKey);

      if (result === 'ok') {
        return 'Redis connection connected';
      }

      return 'Redis connection error: Unexpected value';
    } catch (error: unknown) {
      return `Redis connection failed: ${getErrorMessage(error)}`;
    }
  }

  async setKey<T>(key: string, value: T, ttl?: number): Promise<void> {
    this.log(`Set cache for ${key}`);

    const serializedValue = JSON.stringify(value);

    if (ttl) {
      await this.client.set(key, serializedValue, 'EX', ttl);
    } else {
      await this.client.set(key, serializedValue);
    }
  }

  async getKey<T>(key: string): Promise<T | null> {
    this.log(`Get cache for ${key}`);

    const result = await this.client.get(key);
    return result ? (JSON.parse(result) as T) : null;
  }

  async deleteKey(key: string): Promise<void> {
    this.log(`Delete cache for ${key}`);
    await this.client.del(key);
  }

  async deleteByPattern(pattern: string): Promise<void> {
    this.log(`Delete cache Pattern ${pattern}`);

    const keys = await this.client.keys(pattern);

    if (keys.length) {
      await this.client.del(keys);
    }
  }

  async deleteAll(): Promise<void> {
    await this.client.flushall();
  }
}
