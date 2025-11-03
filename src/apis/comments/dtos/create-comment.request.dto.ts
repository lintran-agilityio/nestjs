// libs
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, Matches } from 'class-validator';
import { REGEX } from '@app/shared/constants';

/**
 * DTO for creating a comment on a post
 */
export class CreateCommentRequestDto {
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

  @ApiProperty({
    description: 'UUID of the post being commented on',
    example: 'b24c3d84-32eb-5b6b-a57e-84b1640cfe89',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(REGEX.UUID_ANY)
  postId: string;
}
