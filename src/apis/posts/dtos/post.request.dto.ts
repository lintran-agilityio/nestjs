// libs
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
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

export class UpdatePostRequestDto extends PartialType(PostRequestDto) {
  @ApiPropertyOptional({
    example: 'my-updated-blog-post',
    description: 'Updated slug of Post',
  })
  slug?: string;

  @ApiPropertyOptional({
    example: 'My updated blog post',
    description: 'Updated title of Post',
  })
  title?: string;

  @ApiPropertyOptional({
    example: 'This is the updated content of my post.',
    description: 'Updated contents of this post',
  })
  contents?: string;

  constructor(partial: Partial<UpdatePostRequestDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}
