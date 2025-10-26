// libs
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Comment } from '../entities';
import { MetadataResponseDto, QueryPaginationParamDto } from '@app/shared/dto';

/**
 * DTO for paginated comment responses
 */
export class CommentPaginationResponseDto {
  @ApiProperty({
    type: [Comment],
    description: 'Array of comment entities',
  })
  data: Comment[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      total: 100,
      page: 1,
      limit: 10,
      totalPages: 10,
    },
  })
  meta: MetadataResponseDto;
}

/**
 * DTO for query parameters when fetching comments
 * Extends QueryPaginationParamDto and adds postId filter
 */
export class QueryCommentParamDto extends QueryPaginationParamDto {
  @ApiProperty({
    description: 'Post ID to filter comments',
    example: 'b24c3d84-32eb-5b6b-a57e-84b1640cfe89',
    required: false,
  })
  @IsOptional()
  @IsString()
  postId?: string;
}
