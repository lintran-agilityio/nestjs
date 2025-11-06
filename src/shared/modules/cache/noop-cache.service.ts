// libs
import { Injectable } from '@nestjs/common';

import { CacheAbstractService } from './cache.abstract.service';

/**
 * No-op cache service that does nothing
 * Used when Redis is disabled to provide a cache interface without actual caching
 */
@Injectable()
export class NoOpCacheService extends CacheAbstractService {
  constructor() {
    // Don't pass logger to avoid any logging
    super();
  }

  async setKey<T>(_key: string, _value: T, _ttl?: number): Promise<void> {
    // No-op: do nothing
  }

  async getKey<T>(_key: string): Promise<T | null> {
    // No-op: always return null (cache miss)
    return null;
  }

  async deleteKey(_key: string): Promise<void> {
    // No-op: do nothing
  }

  async deleteByPattern(_pattern: string): Promise<void> {
    // No-op: do nothing
  }

  async deleteAll(): Promise<void> {
    // No-op: do nothing
  }
}
