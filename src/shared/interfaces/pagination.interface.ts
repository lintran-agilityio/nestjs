import { ISortOptions } from './sort.interface';

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
