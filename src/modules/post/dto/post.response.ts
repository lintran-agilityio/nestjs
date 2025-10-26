// Libs
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

// Local sources
import { CreateUserPostRequestDto } from './create-post.request.dto';

/**
 * DTO for post response
 * Extends create post DTO with unique identifier
 */
export class PostResponseDto extends CreateUserPostRequestDto {
  @ApiProperty({
    description: 'Unique identifier of the post',
    example: 'abcd2312-ab12-ab12-aB11-abcd122345678',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  id: string;
}
