import type { LoggerService } from '@nestjs/common';
import type { ClassConstructor } from 'class-transformer';

import type { CacheAbstractService } from '../modules/cache/cache.abstract.service';
import type { HashingAbstractService } from '../modules/hashing/hashing.abstract.service';
import { UserRole } from './user.type';

export type ValidOwnerShipParamsType = {
  currentUser?: { id: string; email: string; role: UserRole };
  value: string;
  field: 'id' | 'email';
  logger: {
    error: (message: string) => void;
  };
};

export type ValidHashingRefreshTokenParamsType = {
  token: string;
  refreshToken: string;
  hashingService: Pick<HashingAbstractService, 'compare'>;
  logger: Pick<LoggerService, 'error'>;
};

export type ValidUserCacheParamsType<T extends object> = {
  cacheKey: string;
  cacheService: Pick<CacheAbstractService, 'getKey' | 'deleteKey'>;
  logger: Pick<LoggerService, 'log' | 'error'>;
  identifier?: string;
  entity: ClassConstructor<T>;
  validator: (candidate: unknown) => candidate is Record<string, unknown>;
};

export type ValidateCacheEmailParamsType = {
  emailUpdated?: string | null;
  prevEmail?: string | null;
  cachedForFunctionName?: string;
  cacheService: Pick<CacheAbstractService, 'deleteKey'>;
  logger: Pick<LoggerService, 'error'>;
};
