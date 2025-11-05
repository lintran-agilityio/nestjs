// Libs
import { Test, TestingModule } from '@nestjs/testing';
import Redis from 'ioredis';

// App sources
import { AppLoggerService } from '../../logger/logger.service';
import { createMockLoggerProvider } from '@app/shared/mocks';
import { getErrorMessage } from '@app/shared/utils/error.utils';

// Local sources
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;
  let redisClient: jest.Mocked<Redis>;
  let appLoggerService: jest.Mocked<AppLoggerService>;
  let mockLogger: {
    log: jest.Mock;
    error: jest.Mock;
    warn: jest.Mock;
  };

  beforeEach(async () => {
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    redisClient = {
      set: jest.fn(),
      get: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      flushall: jest.fn(),
    } as any;

    appLoggerService = {
      getLoggerName: jest.fn().mockReturnValue(mockLogger),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: RedisService,
          useFactory: () => new RedisService(redisClient, appLoggerService),
        },
        createMockLoggerProvider(),
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkRedisConnection', () => {
    it('should return success message when connection is healthy', async () => {
      redisClient.set.mockResolvedValue('OK' as any);
      redisClient.get.mockResolvedValue('ok');

      const result = await service.checkRedisConnection();

      expect(result).toBe('Redis connection connected');
      expect(redisClient.set).toHaveBeenCalledWith(
        'test:connection',
        'ok',
        'EX',
        60,
      );
      expect(redisClient.get).toHaveBeenCalledWith('test:connection');
    });

    it('should return error message when result is not "ok"', async () => {
      redisClient.set.mockResolvedValue('OK' as any);
      redisClient.get.mockResolvedValue('unexpected');

      const result = await service.checkRedisConnection();

      expect(result).toBe('Redis connection error: Unexpected value');
    });

    it('should return error message when Redis operation fails', async () => {
      const error = new Error('Connection failed');
      redisClient.set.mockRejectedValue(error);

      const result = await service.checkRedisConnection();

      expect(result).toBe(`Redis connection failed: ${getErrorMessage(error)}`);
    });

    it('should handle null result from get', async () => {
      redisClient.set.mockResolvedValue('OK' as any);
      redisClient.get.mockResolvedValue(null);

      const result = await service.checkRedisConnection();

      expect(result).toBe('Redis connection error: Unexpected value');
    });
  });

  describe('setKey', () => {
    it('should set a key with TTL', async () => {
      const key = 'test:key';
      const value = { name: 'test', id: 1 };
      const ttl = 3600;

      redisClient.set.mockResolvedValue('OK' as any);

      await service.setKey(key, value, ttl);

      expect(redisClient.set).toHaveBeenCalledWith(
        key,
        JSON.stringify(value),
        'EX',
        ttl,
      );
      expect(mockLogger.log).toHaveBeenCalledWith(`Set cache for ${key}`);
    });

    it('should set a key without TTL when ttl is not provided', async () => {
      const key = 'test:key';
      const value = { name: 'test' };

      redisClient.set.mockResolvedValue('OK' as any);

      await service.setKey(key, value);

      expect(redisClient.set).toHaveBeenCalledWith(key, JSON.stringify(value));
      expect(mockLogger.log).toHaveBeenCalledWith(`Set cache for ${key}`);
    });

    it('should handle string values', async () => {
      const key = 'test:string';
      const value = 'simple string';

      redisClient.set.mockResolvedValue('OK' as any);

      await service.setKey(key, value);

      expect(redisClient.set).toHaveBeenCalledWith(key, JSON.stringify(value));
    });

    it('should handle array values', async () => {
      const key = 'test:array';
      const value = [1, 2, 3, 'test'];

      redisClient.set.mockResolvedValue('OK' as any);

      await service.setKey(key, value);

      expect(redisClient.set).toHaveBeenCalledWith(key, JSON.stringify(value));
    });

    it('should handle null values', async () => {
      const key = 'test:null';
      const value = null;

      redisClient.set.mockResolvedValue('OK' as any);

      await service.setKey(key, value);

      expect(redisClient.set).toHaveBeenCalledWith(key, JSON.stringify(value));
    });

    it('should handle errors during set', async () => {
      const key = 'test:key';
      const value = { name: 'test' };
      const error = new Error('Redis set failed');

      redisClient.set.mockRejectedValue(error);

      await expect(service.setKey(key, value)).rejects.toThrow(error);
    });
  });

  describe('getKey', () => {
    it('should get and parse a cached key', async () => {
      const key = 'test:key';
      const cachedValue = { name: 'test', id: 1 };
      const serializedValue = JSON.stringify(cachedValue);

      redisClient.get.mockResolvedValue(serializedValue);

      const result = await service.getKey<typeof cachedValue>(key);

      expect(result).toEqual(cachedValue);
      expect(redisClient.get).toHaveBeenCalledWith(key);
      expect(mockLogger.log).toHaveBeenCalledWith(`Get cache for ${key}`);
    });

    it('should return null when key does not exist', async () => {
      const key = 'test:non-existent';

      redisClient.get.mockResolvedValue(null);

      const result = await service.getKey(key);

      expect(result).toBeNull();
      expect(redisClient.get).toHaveBeenCalledWith(key);
    });

    it('should handle string values', async () => {
      const key = 'test:string';
      const value = 'simple string';

      redisClient.get.mockResolvedValue(JSON.stringify(value));

      const result = await service.getKey<string>(key);

      expect(result).toBe(value);
    });

    it('should handle array values', async () => {
      const key = 'test:array';
      const value = [1, 2, 3, 'test'];

      redisClient.get.mockResolvedValue(JSON.stringify(value));

      const result = await service.getKey<typeof value>(key);

      expect(result).toEqual(value);
    });

    it('should handle errors during get', async () => {
      const key = 'test:key';
      const error = new Error('Redis get failed');

      redisClient.get.mockRejectedValue(error);

      await expect(service.getKey(key)).rejects.toThrow(error);
    });

    it('should handle invalid JSON', async () => {
      const key = 'test:key';
      const invalidJson = '{ invalid json }';

      redisClient.get.mockResolvedValue(invalidJson);

      await expect(service.getKey(key)).rejects.toThrow();
    });
  });

  describe('deleteKey', () => {
    it('should delete a key successfully', async () => {
      const key = 'test:key';

      redisClient.del.mockResolvedValue(1);

      await service.deleteKey(key);

      expect(redisClient.del).toHaveBeenCalledWith(key);
      expect(mockLogger.log).toHaveBeenCalledWith(`Delete cache for ${key}`);
    });

    it('should handle errors during delete', async () => {
      const key = 'test:key';
      const error = new Error('Redis delete failed');

      redisClient.del.mockRejectedValue(error);

      await expect(service.deleteKey(key)).rejects.toThrow(error);
    });
  });

  describe('deleteByPattern', () => {
    it('should delete keys matching a pattern', async () => {
      const pattern = 'test:*';
      const matchingKeys = ['test:1', 'test:2', 'test:3'];

      redisClient.keys.mockResolvedValue(matchingKeys);
      redisClient.del.mockResolvedValue(3);

      await service.deleteByPattern(pattern);

      expect(redisClient.keys).toHaveBeenCalledWith(pattern);
      expect(redisClient.del).toHaveBeenCalledWith(matchingKeys);
      expect(mockLogger.log).toHaveBeenCalledWith(
        `Delete cache Pattern ${pattern}`,
      );
    });

    it('should not call del when no keys match pattern', async () => {
      const pattern = 'non-existent:*';

      redisClient.keys.mockResolvedValue([]);

      await service.deleteByPattern(pattern);

      expect(redisClient.keys).toHaveBeenCalledWith(pattern);
      expect(redisClient.del).not.toHaveBeenCalled();
    });

    it('should handle errors during keys lookup', async () => {
      const pattern = 'test:*';
      const error = new Error('Redis keys failed');

      redisClient.keys.mockRejectedValue(error);

      await expect(service.deleteByPattern(pattern)).rejects.toThrow(error);
    });

    it('should handle errors during deletion', async () => {
      const pattern = 'test:*';
      const matchingKeys = ['test:1', 'test:2'];

      redisClient.keys.mockResolvedValue(matchingKeys);
      redisClient.del.mockRejectedValue(new Error('Redis delete failed'));

      await expect(service.deleteByPattern(pattern)).rejects.toThrow();
    });

    it('should handle single key match', async () => {
      const pattern = 'test:single';
      const matchingKeys = ['test:single'];

      redisClient.keys.mockResolvedValue(matchingKeys);
      redisClient.del.mockResolvedValue(1);

      await service.deleteByPattern(pattern);

      expect(redisClient.del).toHaveBeenCalledWith(matchingKeys);
    });
  });

  describe('deleteAll', () => {
    it('should flush all keys from Redis', async () => {
      redisClient.flushall.mockResolvedValue('OK' as any);

      await service.deleteAll();

      expect(redisClient.flushall).toHaveBeenCalled();
    });

    it('should handle errors during flushall', async () => {
      const error = new Error('Redis flushall failed');

      redisClient.flushall.mockRejectedValue(error);

      await expect(service.deleteAll()).rejects.toThrow(error);
    });
  });
});

