// libs
import { Injectable, LoggerService } from '@nestjs/common';
import Redis from 'ioredis';

import { AppLoggerService } from '../logger/logger.service';

@Injectable()
export class RedisService {
  private readonly logger: LoggerService;

  // Inject token into redisService
  constructor(
    private readonly client: Redis,
    private readonly appLoggerServices: AppLoggerService,
  ) {
    // Create context name for logger
    this.logger = this.appLoggerServices.getLoggerName(RedisService.name);
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
    } catch (error) {
      return `Redis connection failed: ${error.message}`;
    }
  }

  async setKey<T>(key: string, value: T, ttl?: number): Promise<void> {
    this.logger.log(`Set cache for ${key}`);

    const serializedValue = JSON.stringify(value);

    if (ttl) {
      await this.client.set(key, serializedValue, 'EX', ttl);
    } else {
      await this.client.set(key, serializedValue);
    }
  }

  async getKey<T>(key: string): Promise<T | null> {
    this.logger.log(`Get cache for ${key}`);

    const result = await this.client.get(key);
    return result ? (JSON.parse(result) as T) : null;
  }

  async deleteKey(key: string): Promise<void> {
    this.logger.log(`Delete cache for ${key}`);
    await this.client.del(key);
  }

  async deleteByPattern(pattern: string): Promise<void> {
    this.logger.log(`Delete cache Pattern ${pattern}`);

    const keys = await this.client.keys(pattern);

    if (keys.length) {
      await this.client.del(keys);
    }
  }

  async deleteAll(): Promise<void> {
    await this.client.flushall();
  }
}
