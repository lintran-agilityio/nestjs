// Libs
import { IsArray, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { REGEX } from '@app/shared/constants';

/**
 * DTO for bulk delete posts operation
 * Validates an array of post IDs for deletion
 */
export class DeletePostsRequestDto {
  @ApiProperty({
    description: 'Array of post IDs to delete',
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '123e4567-e89b-12d3-a456-426614174001',
    ],
    type: [String],
  })
  @IsArray()
  @IsNotEmpty()
  @Matches(REGEX.UUID_ANY, { each: true })
  postIds: string[];
}
