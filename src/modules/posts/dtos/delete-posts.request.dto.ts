// Libs
import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
  @IsUUID(undefined, { each: true })
  postIds: string[];
}
