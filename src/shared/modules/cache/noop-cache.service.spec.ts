import { NoOpCacheService } from './noop-cache.service';

describe('NoOpCacheService', () => {
  let service: NoOpCacheService;

  beforeEach(() => {
    service = new NoOpCacheService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('setKey should resolve without caching', async () => {
    await expect(service.setKey('key', 'value', 60)).resolves.toBeUndefined();
  });

  it('getKey should always return null', async () => {
    const result = await service.getKey('missing-key');
    expect(result).toBeNull();
  });

  it('deleteKey should resolve without side effects', async () => {
    await expect(service.deleteKey('key')).resolves.toBeUndefined();
  });

  it('deleteByPattern should resolve without side effects', async () => {
    await expect(service.deleteByPattern('pattern:*')).resolves.toBeUndefined();
  });

  it('deleteAll should resolve without side effects', async () => {
    await expect(service.deleteAll()).resolves.toBeUndefined();
  });
});


