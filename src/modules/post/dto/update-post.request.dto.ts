// Libs
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * DTO for updating user post information
 * Contains title and content fields
 */
export class UpdateUserPostRequestDto {
  @ApiProperty({
    description: 'Title of the post',
    example: 'My first blog post',
  })
  @IsNotEmpty()
  @MaxLength(255)
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Content of the post',
    example: 'This is the content of my first post.',
  })
  @IsNotEmpty()
  @IsString()
  contents: string;

  constructor(partial: Partial<UpdateUserPostRequestDto>) {
    Object.assign(this, partial);
  }
}
