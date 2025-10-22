import { Type } from '@nestjs/common';

export interface ISwaggerResponseOptions {
  summary: string;
  type: Type<unknown> | string;
  description?: string;
  isArray?: boolean;
}
