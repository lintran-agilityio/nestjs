// libs
import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class PostRequestDto {
  @ApiProperty({
    example: 'my-first-blog-post',
    description: 'Slug of Post',
  })
  @IsDefined()
  @IsNotEmpty()
  @MaxLength(255)
  @IsString()
  slug: string;

  @ApiProperty({
    example: 'My first blog post',
    description: 'Title of Post',
  })
  @IsDefined()
  @IsNotEmpty()
  @MaxLength(255)
  @IsString()
  title: string;

  @ApiProperty({
    example: 'This is the content of my first post.',
    description: 'Content of this post',
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  contents: string;

  constructor(partial: Partial<PostRequestDto>) {
    Object.assign(this, partial);
  }
}
