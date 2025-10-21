import { OrderBy } from '../types';

export interface ISortOptions {
  sortBy?: string;
  orderBy?: OrderBy.ASC | OrderBy.DESC;
}
