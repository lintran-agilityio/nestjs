export enum OrderBy {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface IMessageAndCountResponse {
  message: string;
  count?: number;
}
