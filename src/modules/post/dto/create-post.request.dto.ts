// Libs
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

// Local sources
import { UpdateUserPostRequestDto } from './update-post.request.dto';

/**
 * DTO for creating a new user post
 * Extends the update DTO with author identification
 */
export class CreateUserPostRequestDto extends UpdateUserPostRequestDto {
  @ApiProperty({
    description: 'UUID of the user who authored the post',
    example: 'c13a2b73-21da-4a5a-946d-73a053fbe8c1',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  authorId: string;
}
