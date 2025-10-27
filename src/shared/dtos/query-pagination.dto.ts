import { VALIDATION_RULES } from '@app/shared/constants';
import { ISearchQuery } from '@app/shared/interfaces';
import { ApiProperty } from '@nestjs/swagger';

export class QueryPaginationParamDto implements ISearchQuery {
  @ApiProperty({
    type: String,
    description: 'Search text',
    example: 'Jon',
    required: false,
  })
  search?: string;

  @ApiProperty({
    type: String,
    description: 'Order data by',
    example: 'ASC',
    required: false,
  })
  orderBy?: 'ASC';

  @ApiProperty({
    type: Number,
    description: 'The limit number data will query',
    example: VALIDATION_RULES.PAGINATION.ITEMS_PER_PAGE.DEFAULT,
    required: false,
  })
  limit?: number;

  @ApiProperty({
    type: Number,
    description: 'The page will query',
    example: 1,
    required: false,
  })
  page?: number;

  @ApiProperty({
    type: String,
    description: 'The field name need to sort',
    example: 'id',
    required: false,
  })
  sortBy?: string;

  constructor(partial: Partial<QueryPaginationParamDto>) {
    Object.assign(this, partial);
  }
}
