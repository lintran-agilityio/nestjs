import { chunkArray } from './objects.utils';
import { BATCH_SIZE } from '../constants';
import {
  IDeleteItemsInArrayConfig,
  IDeleteItemsInArrayResponse,
  EntityWithStringId,
} from '../types';

/**
 * Generic utility function to delete items in batches for better performance.
 *
 * Uses senior TypeScript patterns including:
 * - Generics with constraints to ensure type safety
 * - Optional parameters with defaults
 * - Comprehensive error handling with partial success tracking
 *
 * @template T - Type that extends EntityWithStringId (must have an id property)
 * @param config - Configuration object containing items, repository, logger, and optional batch size
 * @returns Promise resolving to deletion statistics including successful and failed deletions
 *
 * @example
 * ```typescript
 * const result = await deleteItemsInArray({
 *   items: comments,
 *   batchSize: 50,
 *   itemRepository: this.commentsRepo,
 *   logger: this.logger
 * });
 * ```
 */
export const deleteItemsInArray = async <
  T extends EntityWithStringId = EntityWithStringId,
>(
  config: IDeleteItemsInArrayConfig<T>,
): Promise<IDeleteItemsInArrayResponse> => {
  const { items, batchSize = BATCH_SIZE, itemRepository, logger } = config;
  const batches = chunkArray(items, batchSize);
  let totalDeletedCount = 0;
  const allDeletedIds: string[] = [];
  const failedIds: string[] = [];

  for (const batch of batches) {
    try {
      const deletedItems = await itemRepository.softRemove(batch);

      totalDeletedCount += deletedItems.length;
      allDeletedIds.push(...deletedItems.map((item) => item.id));

      logger.log(`Successfully deleted batch of ${batch.length} items`);
    } catch (error) {
      const batchIds = batch.map((item) => item.id);
      failedIds.push(...batchIds);

      logger.error(`Failed to delete batch: ${JSON.stringify(error)}`);
    }
  }

  return {
    deletedCount: totalDeletedCount,
    deletedIds: allDeletedIds,
    failedIds,
  };
};
