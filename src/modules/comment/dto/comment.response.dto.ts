// libs
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { CreateCommentRequestDto } from './create-comment.request.dto';

/**
 * DTO for comment response
 * Extends CreateCommentRequestDto and adds the generated ID
 */
export class CommentResponseDto extends CreateCommentRequestDto {
  @ApiProperty({
    type: String,
    description: 'Unique identifier of the comment',
    example: 'd35e4f95-43fc-6c7c-b68f-95c2751dgfa0',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  id: string;
}
