// Libs
import { ApiProperty } from '@nestjs/swagger';

// Local sources
import { Post } from '../entities';

// App sources
import { MetadataResponseDto } from '@app/shared/dtos';
import { IPaginationResponse } from '@app/shared/interfaces';

/**
 * DTO for paginated post response
 * Contains array of posts and pagination metadata
 */
export class PostPaginationResponseDto implements IPaginationResponse<Post> {
  @ApiProperty({
    description: 'Array of posts',
    type: [Post],
  })
  data: Post[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: MetadataResponseDto,
  })
  meta: MetadataResponseDto;

  constructor(partial: Partial<PostPaginationResponseDto>) {
    Object.assign(this, partial);
  }
}
