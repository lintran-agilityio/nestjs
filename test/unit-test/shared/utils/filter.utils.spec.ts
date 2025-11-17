import { LoggerService } from '@nestjs/common';
import { Repository } from 'typeorm';
import { deleteItemsInArray } from '@app/shared/utils/filter.utils';
import { BATCH_SIZE } from '@app/shared/constants';
import { EntityWithStringId } from '@app/shared/types';

describe('Filter Utils', () => {
  describe('deleteItemsInArray', () => {
    type MinimalLogger = Pick<
      LoggerService,
      'log' | 'error' | 'warn' | 'debug' | 'verbose'
    >;

    let repoImpl: {
      softRemove: jest.Mock<
        Promise<EntityWithStringId[]>,
        [EntityWithStringId[]]
      >;
    };
    let itemRepository: Repository<EntityWithStringId>;
    let mockLogger: jest.Mocked<MinimalLogger>;

    beforeEach(() => {
      repoImpl = {
        softRemove: jest.fn<
          Promise<EntityWithStringId[]>,
          [EntityWithStringId[]]
        >(),
      };
      itemRepository = repoImpl as unknown as Repository<EntityWithStringId>;

      mockLogger = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
      } as unknown as jest.Mocked<MinimalLogger>;
    });
    const items = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
      { id: '3', name: 'Item 3' },
    ];
    describe('successful deletion scenarios', () => {
      it('should delete items in a single batch', async () => {
        repoImpl.softRemove.mockResolvedValue(items);

        const result = await deleteItemsInArray({
          items,
          itemRepository,
          logger: mockLogger,
        });

        expect(result.deletedCount).toBe(3);
        expect(result.deletedIds).toEqual(['1', '2', '3']);
        expect(result.failedIds).toEqual([]);
        expect(repoImpl.softRemove).toHaveBeenCalledTimes(1);
        expect(repoImpl.softRemove).toHaveBeenCalledWith(items);
        expect(mockLogger.log).toHaveBeenCalledWith(
          'Successfully deleted batch of 3 items',
        );
      });

      it('should delete items in multiple batches', async () => {
        const items = Array.from({ length: 10 }, (_, i) => ({
          id: `${i + 1}`,
          name: `Item ${i + 1}`,
        }));

        repoImpl.softRemove.mockImplementation(
          async (batch: EntityWithStringId[]) => {
            return batch;
          },
        );

        const result = await deleteItemsInArray({
          items,
          batchSize: 5,
          itemRepository,
          logger: mockLogger,
        });

        expect(result.deletedCount).toBe(10);
        expect(result.deletedIds).toHaveLength(10);
        expect(result.failedIds).toEqual([]);
        expect(repoImpl.softRemove).toHaveBeenCalledTimes(2);
        expect(mockLogger.log).toHaveBeenCalledTimes(2);
      });

      it('should use default BATCH_SIZE when not specified', async () => {
        const items = Array.from({ length: BATCH_SIZE + 10 }, (_, i) => ({
          id: `${i + 1}`,
          name: `Item ${i + 1}`,
        }));

        repoImpl.softRemove.mockImplementation(
          async (batch: EntityWithStringId[]) => {
            return batch;
          },
        );

        const result = await deleteItemsInArray({
          items,
          itemRepository,
          logger: mockLogger,
        });

        expect(result.deletedCount).toBe(items.length);
        expect(repoImpl.softRemove).toHaveBeenCalledTimes(2); // Should create 2 batches
      });

      it('should handle empty array gracefully', async () => {
        const result = await deleteItemsInArray({
          items: [],
          itemRepository,
          logger: mockLogger,
        });

        expect(result.deletedCount).toBe(0);
        expect(result.deletedIds).toEqual([]);
        expect(result.failedIds).toEqual([]);
        expect(repoImpl.softRemove).not.toHaveBeenCalled();
        expect(mockLogger.log).not.toHaveBeenCalled();
      });
    });

    describe('error handling scenarios', () => {
      it('should handle batch deletion failure and track failed IDs', async () => {
        const error = new Error('Database connection failed');
        repoImpl.softRemove.mockRejectedValue(error);

        const result = await deleteItemsInArray({
          items,
          itemRepository,
          logger: mockLogger,
        });

        expect(result.deletedCount).toBe(0);
        expect(result.deletedIds).toEqual([]);
        expect(result.failedIds).toEqual(['1', '2', '3']);
        expect(mockLogger.error).toHaveBeenCalled();
      });

      it('should handle partial batch failures', async () => {
        repoImpl.softRemove
          .mockResolvedValueOnce([items[0], items[1]]) // First batch succeeds
          .mockRejectedValueOnce(new Error('Batch 2 failed')); // Second batch fails

        const result = await deleteItemsInArray({
          items,
          batchSize: 2,
          itemRepository,
          logger: mockLogger,
        });

        expect(result.deletedCount).toBe(2);
        expect(result.deletedIds).toEqual(['1', '2']);
        expect(result.failedIds).toEqual(['3']);
        expect(mockLogger.log).toHaveBeenCalledWith(
          'Successfully deleted batch of 2 items',
        );
        expect(mockLogger.error).toHaveBeenCalled();
      });

      it('should log error details when batch fails', async () => {
        const error = { code: 'ERR001', message: 'Failed to delete' };

        repoImpl.softRemove.mockRejectedValue(error);

        await deleteItemsInArray({
          items: [items[0]],
          itemRepository,
          logger: mockLogger,
        });

        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to delete batch'),
        );
      });
    });

    describe('different batch sizes', () => {
      it('should process with custom batch size of 1', async () => {
        repoImpl.softRemove.mockImplementation(
          async (batch: EntityWithStringId[]) => {
            return batch;
          },
        );

        const result = await deleteItemsInArray({
          items,
          batchSize: 1,
          itemRepository,
          logger: mockLogger,
        });

        expect(result.deletedCount).toBe(3);
        expect(repoImpl.softRemove).toHaveBeenCalledTimes(3);
      });

      it('should process with custom batch size of 10', async () => {
        const items = Array.from({ length: 25 }, (_, i) => ({
          id: `${i + 1}`,
          name: `Item ${i + 1}`,
        }));

        repoImpl.softRemove.mockImplementation(
          async (batch: EntityWithStringId[]) => {
            return batch;
          },
        );

        const result = await deleteItemsInArray({
          items,
          batchSize: 10,
          itemRepository,
          logger: mockLogger,
        });

        expect(result.deletedCount).toBe(25);
        expect(repoImpl.softRemove).toHaveBeenCalledTimes(3); // 3 batches of 10, 10, 5
      });
    });

    describe('real-world scenarios', () => {
      it('should handle a large dataset successfully', async () => {
        const items = Array.from({ length: 150 }, (_, i) => ({
          id: `item-${i + 1}`,
          data: `Data ${i + 1}`,
        }));

        repoImpl.softRemove.mockImplementation(
          async (batch: EntityWithStringId[]) => {
            return batch;
          },
        );

        const result = await deleteItemsInArray({
          items,
          batchSize: BATCH_SIZE,
          itemRepository,
          logger: mockLogger,
        });

        expect(result.deletedCount).toBe(150);
        expect(result.deletedIds).toHaveLength(150);
        expect(result.failedIds).toEqual([]);
        expect(repoImpl.softRemove).toHaveBeenCalledTimes(3);
      });

      it('should handle mixed success and failure batches', async () => {
        const items = Array.from({ length: 6 }, (_, i) => ({
          id: `${i + 1}`,
        }));

        let callCount = 0;
        repoImpl.softRemove.mockImplementation(
          (batch: EntityWithStringId[]) => {
            callCount++;
            if (callCount === 2) {
              throw new Error('Network error');
            }
            return Promise.resolve(batch);
          },
        );

        const result = await deleteItemsInArray({
          items,
          batchSize: 2,
          itemRepository,
          logger: mockLogger,
        });

        expect(result.deletedCount).toBe(4);
        expect(result.failedIds).toEqual(['3', '4']);
        expect(mockLogger.error).toHaveBeenCalledTimes(1);
      });

      it('should process items with complex structures', async () => {
        interface ComplexItem {
          id: string;
          metadata: {
            createdAt: Date;
            tags: string[];
          };
        }

        const items: ComplexItem[] = [
          {
            id: 'complex-1',
            metadata: {
              createdAt: new Date(),
              tags: ['tag1', 'tag2'],
            },
          },
          {
            id: 'complex-2',
            metadata: {
              createdAt: new Date(),
              tags: ['tag3'],
            },
          },
        ];

        repoImpl.softRemove.mockResolvedValue(items);

        const result = await deleteItemsInArray({
          items,
          itemRepository,
          logger: mockLogger,
        });

        expect(result.deletedCount).toBe(2);
        expect(result.deletedIds).toEqual(['complex-1', 'complex-2']);
        expect(repoImpl.softRemove).toHaveBeenCalledWith(items);
      });
    });

    describe('logging behavior', () => {
      it('should log success messages for each batch', async () => {
        const items = Array.from({ length: 5 }, (_, i) => ({
          id: `${i + 1}`,
        }));

        repoImpl.softRemove.mockImplementation(
          async (batch: EntityWithStringId[]) => {
            return batch;
          },
        );

        await deleteItemsInArray({
          items,
          batchSize: 2,
          itemRepository,
          logger: mockLogger,
        });

        expect(mockLogger.log).toHaveBeenCalledWith(
          'Successfully deleted batch of 2 items',
        );
        expect(mockLogger.log).toHaveBeenCalledWith(
          'Successfully deleted batch of 2 items',
        );
        expect(mockLogger.log).toHaveBeenCalledWith(
          'Successfully deleted batch of 1 items',
        );
      });

      it('should log error messages with error details', async () => {
        const error = { message: 'Connection timeout', code: 'TIMEOUT' };

        repoImpl.softRemove.mockRejectedValue(error);

        await deleteItemsInArray({
          items: [items[0]],
          itemRepository,
          logger: mockLogger,
        });

        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to delete batch'),
        );
      });
    });
  });
});
