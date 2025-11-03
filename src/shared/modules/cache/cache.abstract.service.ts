// Libs
import { Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export abstract class CacheAbstractService {
  protected readonly logger?: LoggerService;

  constructor(logger?: LoggerService) {
    this.logger = logger;
  }

  abstract setKey<T>(key: string, value: T, ttl?: number): Promise<void>;

  abstract getKey<T>(key: string): Promise<T | null>;

  abstract deleteKey(key: string): Promise<void>;

  abstract deleteByPattern(pattern: string): Promise<void>;

  abstract deleteAll(): Promise<void>;

  protected log(message: string) {
    if (this.logger) {
      this.logger.log?.(message);
    }
  }
}
