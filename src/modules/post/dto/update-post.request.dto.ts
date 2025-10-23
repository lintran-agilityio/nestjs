// libs
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateUserPostRequestDto {
  @ApiProperty({
    example: 'My first blog post',
    description: 'Title of Post',
  })
  @IsNotEmpty()
  @MaxLength(255)
  @IsString()
  title: string;

  @ApiProperty({
    example: 'This is the content of my first post.',
    description: 'Content of this post',
  })
  @IsNotEmpty()
  @IsString()
  contents: string;

  constructor(partial: Partial<UpdateUserPostRequestDto>) {
    Object.assign(this, partial);
  }
}
