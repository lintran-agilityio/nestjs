export enum OrderBy {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface IMessageAndCountResponse {
  message: string;
  count?: number;
}

export enum CacheProvider {
  REDIS = 'redis',
  MEMORY = 'memory',
}
