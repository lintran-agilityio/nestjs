// Libs
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

import { VALIDATION_RULES } from '@app/shared/constants';
import { ISearchQuery } from '@app/shared/interfaces';
import { OrderBy } from '../types';

export class QueryPaginationParamDto implements ISearchQuery {
  @ApiProperty({
    type: String,
    description: 'Search text',
    example: 'Jon',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    type: String,
    description: 'Order data by',
    example: 'ASC',
    required: false,
  })
  @IsOptional()
  @IsString()
  orderBy?: OrderBy;

  @ApiProperty({
    type: Number,
    description: 'The limit number data will query',
    example: VALIDATION_RULES.PAGINATION.ITEMS_PER_PAGE.DEFAULT,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiProperty({
    type: Number,
    description: 'The page will query',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({
    type: String,
    description: 'The field name need to sort',
    example: 'id',
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: string;
}
