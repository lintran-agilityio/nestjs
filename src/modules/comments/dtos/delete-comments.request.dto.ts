// libs
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, Matches } from 'class-validator';
import { REGEX } from '@app/shared/constants';

/**
 * DTO for deleting comments
 * Validates array of comment IDs to be deleted
 */
export class DeleteCommentsRequestDto {
  @ApiProperty({
    description: 'Array of comment IDs to delete',
    example: [
      'd35e4f95-43fc-6c7c-b68f-95c2751dgfa0',
      'e46f5a06-54gd-7d8d-c79g-a6d3862ehgb1',
    ],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @Matches(REGEX.UUID_ANY, { each: true })
  commentIds: string[];
}
