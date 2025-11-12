// Libs
import { Provider } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// App sources
import { AppLoggerService } from '@app/shared/modules/logger/logger.service';

type PartialRepo<T> = Partial<Record<keyof Repository<T> | string, jest.Mock>>;

export const createMockLoggerProvider = (): Provider => {
  return {
    provide: AppLoggerService,
    useValue: {
      getLoggerName: jest.fn().mockReturnValue({
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
      }),
    },
  } satisfies Provider;
};

export const createRepositoryProvider = <T>(
  entity: new () => T,
  overrides?: PartialRepo<T>,
): Provider => {
  const defaultRepo: PartialRepo<T> = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    merge: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  return {
    provide: getRepositoryToken(entity),
    useValue: { ...defaultRepo, ...(overrides ?? {}) },
  };
};
