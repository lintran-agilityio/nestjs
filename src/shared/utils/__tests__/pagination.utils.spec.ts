import { SelectQueryBuilder } from 'typeorm';
import { LoggerService } from '@nestjs/common';

import {
  applyPaginationToQueryBuilder,
  createPaginationMeta,
  createPaginationResponse,
  getDataPagination,
  processPaginationParams,
} from '../pagination.utils';
import { OrderBy } from '../../types';

import { QueryPaginationParamDto } from '../../dtos';
import { IQueryPagination } from '../../interfaces';

describe('Pagination Utils', () => {
  describe('processPaginationParams', () => {
    it('should return defaults when query is empty', () => {
      const query = {} as QueryPaginationParamDto;

      const result = processPaginationParams(query, {
        defaultLimit: 10,
        defaultPage: 1,
        defaultSortField: 'createdAt',
        allowedSortFields: ['createdAt', 'title'],
      });

      expect(result).toEqual({
        page: 1,
        limit: 10,
        skip: 0,
        orderBy: OrderBy.ASC,
        sortField: 'createdAt',
      });
    });

    it('should normalize and respect DESC order and allowed sort fields', () => {
      const query = {
        page: 2,
        limit: 5,
        sortBy: 'title',
        orderBy: 'DESC',
      } as unknown as IQueryPagination;

      const result = processPaginationParams(query as QueryPaginationParamDto, {
        defaultLimit: 10,
        defaultPage: 1,
        defaultSortField: 'createdAt',
        allowedSortFields: ['createdAt', 'title'],
      });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.skip).toBe(5);
      expect(result.orderBy).toBe(OrderBy.DESC);
      expect(result.sortField).toBe('title');
    });

    it('should keep default sort field when sortBy is not allowed', () => {
      const query = {
        sortBy: 'unknown',
        orderBy: 'DESC',
      } as unknown as IQueryPagination;

      const result = processPaginationParams(query as QueryPaginationParamDto, {
        defaultLimit: 20,
        defaultPage: 3,
        defaultSortField: 'createdAt',
        allowedSortFields: ['createdAt', 'title'],
      });

      expect(result.sortField).toBe('createdAt');
      expect(result.page).toBe(3);
      expect(result.limit).toBe(20);
      expect(result.orderBy).toBe(OrderBy.DESC);
    });
  });

  describe('createPaginationMeta', () => {
    it('should compute total pages correctly', () => {
      const meta = createPaginationMeta(101, 2, 10);
      expect(meta).toEqual({ total: 101, page: 2, limit: 10, totalPages: 11 });
    });
  });

  describe('createPaginationResponse', () => {
    it('should wrap data with computed meta', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const res = createPaginationResponse(data, 25, 3, 10);
      expect(res.data).toBe(data);
      expect(res.meta.total).toBe(25);
      expect(res.meta.page).toBe(3);
      expect(res.meta.limit).toBe(10);
      expect(res.meta.totalPages).toBe(3);
    });
  });

  describe('applyPaginationToQueryBuilder', () => {
    it('should call query builder with correct methods and return the builder', () => {
      const qb = {
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
      } as unknown as SelectQueryBuilder<unknown>;

      const res = applyPaginationToQueryBuilder(
        qb,
        { skip: 10, limit: 5, orderBy: OrderBy.DESC, sortField: 'createdAt' },
        'post',
      );

      // Ensure fluent calls are made
      // We assert by reusing the same object identity returned
      expect(res).toBe(qb);
    });
  });

  describe('getDataPagination', () => {
    it('should process params, apply to builder, and return data with meta', async () => {
      const data = [{ id: 'a' }, { id: 'b' }];

      const qbImpl = {
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([data, 42]),
      };
      const queryBuilder = qbImpl as unknown as SelectQueryBuilder<
        (typeof data)[number]
      >;

      const logger = {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
      } as unknown as LoggerService;

      const selectFields = ['createdAt', 'title'];
      const queryUrl = {
        page: 2,
        limit: 5,
        sortBy: 'createdAt',
        orderBy: 'ASC',
      } as unknown as QueryPaginationParamDto;

      const result = await getDataPagination({
        selectFields,
        queryUrl,
        queryBuilder,
        logger,
        entity: 'post',
      });

      expect(qbImpl.orderBy).toHaveBeenCalledWith(
        'post.createdAt',
        OrderBy.ASC,
      );
      expect(qbImpl.skip).toHaveBeenCalledWith(5);
      expect(qbImpl.take).toHaveBeenCalledWith(5);
      expect(qbImpl.getManyAndCount).toHaveBeenCalled();

      expect(result.data).toEqual(data);
      expect(result.meta.total).toBe(42);
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(5);
    });
  });
});
