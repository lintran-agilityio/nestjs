import { ApiProperty } from '@nestjs/swagger';
import { IMetadata } from '../interfaces';

export class MetadataResponseDto implements IMetadata {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  total: number;

  @ApiProperty({
    type: Number,
    example: 1,
  })
  totalPages: number;

  @ApiProperty({
    type: Number,
    example: 1,
  })
  limit: number;

  @ApiProperty({
    type: Number,
    example: 1,
  })
  page: number;
}
