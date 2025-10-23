// libs
import { ApiProperty } from '@nestjs/swagger';

import { IPaginationResponse } from '@app/shared/interfaces';
import { Post } from '../entities';
import { MetadataResponseDto } from '@app/shared/dto';

export class PostPaginationResponseDto implements IPaginationResponse<Post> {
  @ApiProperty({
    description: 'List Post of User',
    type: [Post],
  })
  data: Post[];

  @ApiProperty({
    description: 'Metadata pagination',
    type: MetadataResponseDto,
  })
  meta: MetadataResponseDto;

  constructor(partial: Partial<PostPaginationResponseDto>) {
    Object.assign(this, partial);
  }
}
