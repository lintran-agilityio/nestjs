// libs
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  // Inject token into redisService
  constructor(private readonly client: Redis) {}

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
    const serializedValue = JSON.stringify(value);

    if (ttl) {
      await this.client.set(key, serializedValue, 'EX', ttl);
    } else {
      await this.client.set(key, serializedValue);
    }
  }

  async getKey<T>(key: string): Promise<T | null> {
    const result = await this.client.get(key);
    return result ? (JSON.parse(result) as T) : null;
  }

  async deleteKey(key: string): Promise<void> {
    await this.client.del(key);
  }

  async deleteByPattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(pattern);

    if (keys.length) {
      await this.client.del(keys);
    }
  }
}
