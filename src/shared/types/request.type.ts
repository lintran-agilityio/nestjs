import { LoggerService } from '@nestjs/common';
import { Repository } from 'typeorm';

/**
 * Represents an entity with string ID for generic operations
 */
export type EntityWithStringId = {
  id: string;
};

/**
 * Helper type to extract entity from repository
 */
export type ExtractEntityFromRepository<T> =
  T extends Repository<infer E> ? E : never;

/**
 * Parameters for the deleteItemsInArray function
 * Uses senior TypeScript patterns with explicit repository constraints
 */
export interface IDeleteItemsInArrayConfig<T extends EntityWithStringId> {
  items: T[];
  batchSize?: number;
  itemRepository: Repository<T>;
  logger: LoggerService;
}

/**
 * Response type for the deleteItemsInArray function
 */
export interface IDeleteItemsInArrayResponse {
  deletedCount: number;
  deletedIds: string[];
  failedIds?: string[];
}
