import { ApiProperty } from '@nestjs/swagger';

export class PostCommentDto {
  @ApiProperty({
    type: String,
    description: 'Post ID',
    example: 'd35e4f95-43fc-6c7c-b68f-95c2751dgfa0',
  })
  id: string;

  @ApiProperty({
    type: String,
    description: 'Post title',
    example: 'My First Post',
  })
  title: string;
}
