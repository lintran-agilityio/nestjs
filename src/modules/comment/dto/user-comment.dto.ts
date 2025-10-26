import { ApiProperty } from '@nestjs/swagger';

export class UserCommentDto {
  @ApiProperty({
    type: String,
    description: 'User ID',
    example: 'd35e4f95-43fc-6c7c-b68f-95c2751dgfa0',
  })
  id: string;

  @ApiProperty({
    type: String,
    description: 'First name',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    type: String,
    description: 'Last name',
    example: 'Doe',
  })
  lastName: string;
}
