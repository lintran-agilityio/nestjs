import { SelectQueryBuilder } from 'typeorm';
import { QueryPaginationParamDto } from '../dtos';
import { OrderBy } from '../types';
import { ISortOptions } from './sort.interface';
import { LoggerService } from '@nestjs/common';

export interface IPaginationBase {
  page: number;
  limit: number;
}

export interface IPaginationQuery
  extends ISortOptions,
    Partial<IPaginationBase> {}

export interface IMetadata extends IPaginationBase {
  total: number;
  totalPages: number;
}

export interface IPaginationResponse<T> {
  data: T[];
  meta: IMetadata;
}

/**
 * Interface for pagination configuration
 */
export interface IPaginationConfig {
  /**
   * Default limit if not provided
   */
  defaultLimit?: number;
  /**
   * Default page if not provided
   */
  defaultPage?: number;
  /**
   * Default sort field if not provided
   */
  defaultSortField?: string;
  /**
   * Default order direction if not provided
   */
  defaultOrderBy?: OrderBy;
  /**
   * Fields allowed for sorting
   */
  allowedSortFields?: string[];
}

export interface ISearchQuery {
  search?: string;
}

// Interface for query params
export interface IQueryPagination {
  search?: string;
  orderBy?: OrderBy;
  limit?: number;
  page?: number;
  sortBy?: string;
}

export interface IPaginationParams {
  page: number;
  limit: number;
  skip: number;
  orderBy: OrderBy;
  sortField: string;
}

/**
 * Interface for getDataPagination function parameters
 */
export interface IGetDataPaginationParams<T> {
  /**
   * Array of field names to select from the entity
   */
  selectFields: string[];
  /**
   * Query pagination parameters from the request
   */
  queryUrl: QueryPaginationParamDto;
  /**
   * TypeORM query builder with entity data
   */
  queryBuilder: SelectQueryBuilder<T>;
  /**
   * Logger service for logging operations
   */
  logger: LoggerService;
  /**
   * Entity alias name used in query builder (e.g., 'user', 'post')
   */
  entity: string;
}

/**
 * Interface for pagination result
 */
export interface IPaginationResult<T> {
  data: T[];
  meta: IMetadata;
}
