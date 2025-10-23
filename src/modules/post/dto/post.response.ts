// libs
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

import { CreateUserPostRequestDto } from './create-post.request.dto';

export class PostResponseDto extends CreateUserPostRequestDto {
  @ApiProperty({
    type: String,
    description: 'Id of user',
    example: 'abcd2312-ab12-ab12-aB11-abcd122345678',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  id: string;
}
