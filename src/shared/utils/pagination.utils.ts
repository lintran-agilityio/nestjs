import { SelectQueryBuilder } from 'typeorm';
import { OrderBy } from '../types';
import { QueryPaginationParamDto } from '../dtos';
import {
  IGetDataPaginationParams,
  IMetadata,
  IPaginationConfig,
  IPaginationParams,
  IPaginationResult,
  IQueryPagination,
} from '../interfaces';

/**
 * Processes pagination parameters and returns normalized values
 *
 * @param queryUrl - Query parameters from request
 * @param config - Configuration for pagination defaults
 * @returns Normalized pagination values
 */
export const processPaginationParams = (
  queryUrl: QueryPaginationParamDto,
  config: IPaginationConfig = {},
): IPaginationParams => {
  const {
    defaultLimit = 10,
    defaultPage = 1,
    defaultSortField = 'createdAt',
    defaultOrderBy = OrderBy.ASC,
    allowedSortFields = [],
  } = config;

  // THE FIX: Cast queryUrl to a safe interface before destructuring.
  // This explicitly tells ESLint/TS exactly what types it's working with.
  const { limit, page, orderBy, sortBy } = queryUrl as IQueryPagination;

  // Normalize page and limit
  // Typescript now knows 'page' is number | undefined
  const normalizedPage = page ?? defaultPage;
  const normalizedLimit = limit ?? defaultLimit;

  // Calculate skip
  const skip = (normalizedPage - 1) * normalizedLimit;

  // Normalize orderBy
  // Typescript now knows 'orderBy' is string | undefined
  let normalizedOrderBy = defaultOrderBy;

  if (typeof orderBy === 'string') {
    const upperOrderBy = orderBy.toUpperCase();
    normalizedOrderBy = upperOrderBy === 'DESC' ? OrderBy.DESC : OrderBy.ASC;
  }

  // Validate and set sort field
  let normalizedSortField = defaultSortField;

  // Logic to set normalizedSortField to 'sortBy' if valid
  // Typescript now knows 'sortBy' is string | undefined
  if (typeof sortBy === 'string' && sortBy.length > 0) {
    if (allowedSortFields.includes(sortBy)) {
      normalizedSortField = sortBy;
    }
  }

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip,
    orderBy: normalizedOrderBy,
    sortField: normalizedSortField,
  };
};

/**
 * Applies pagination and sorting to a TypeORM query builder
 *
 * @param queryBuilder - TypeORM query builder
 * @param params - Pagination parameters
 * @param entityAlias - Entity alias used in query builder (e.g., 'user', 'post', 'comment')
 * @returns Query builder with pagination and sorting applied
 */
export const applyPaginationToQueryBuilder = <T>(
  queryBuilder: SelectQueryBuilder<T>,
  params: {
    skip: number;
    limit: number;
    orderBy: OrderBy;
    sortField: string;
  },
  entityAlias: string,
): SelectQueryBuilder<T> =>
  queryBuilder
    .orderBy(`${entityAlias}.${params.sortField}`, params.orderBy)
    .skip(params.skip)
    .take(params.limit);

/**
 * Creates pagination metadata
 *
 * @param total - Total number of items
 * @param page - Current page
 * @param limit - Items per page
 * @returns Metadata object
 */
export const createPaginationMeta = (
  total: number,
  page: number,
  limit: number,
): IMetadata => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

/**
 * Creates a pagination response with data and metadata
 *
 * @param data - Array of data items
 * @param total - Total number of items
 * @param page - Current page
 * @param limit - Items per page
 * @returns Pagination response object
 */
export const createPaginationResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): IPaginationResult<T> => ({
  data,
  meta: createPaginationMeta(total, page, limit),
});

/**
 * Retrieves paginated data from a query builder with sorting and filtering
 *
 * @param params - Object containing selectFields, queryUrl, queryBuilder, logger, and entity
 * @returns Paginated response with data and metadata
 */
export const getDataPagination = async <T>({
  selectFields,
  queryUrl,
  queryBuilder,
  logger,
  entity,
}: IGetDataPaginationParams<T>): Promise<IPaginationResult<T>> => {
  // Process pagination parameters
  const paginationParams = processPaginationParams(queryUrl, {
    defaultLimit: 10,
    defaultPage: 1,
    defaultSortField: 'createdAt',
    defaultOrderBy: OrderBy.DESC,
    allowedSortFields: selectFields,
  });

  logger.log(`Pagination params: ${JSON.stringify(paginationParams)}`);
  // Apply sorting and pagination
  const queryBuilderPagination = applyPaginationToQueryBuilder(
    queryBuilder,
    paginationParams,
    entity,
  );

  const [data, total] = await queryBuilderPagination.getManyAndCount();

  logger.log(`Get all ${entity}s successful: ${JSON.stringify(data)}`);

  return createPaginationResponse(
    data,
    total,
    paginationParams.page,
    paginationParams.limit,
  );
};
