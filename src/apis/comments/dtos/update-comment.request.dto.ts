// libs
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * DTO for updating comment content
 * Used as base class for create and update operations
 */
export class UpdateCommentRequestDto {
  @ApiProperty({
    example: 'This is a great post! I found it very helpful.',
    description: 'Content of the comment',
    maxLength: 2000,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000, {
    message: 'Comment content must not exceed 2000 characters',
  })
  content: string;
}
