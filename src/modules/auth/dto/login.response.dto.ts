// Libs
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { UserInfoResponseDto } from './user-info.response.dto';

// Create dto for user registration response
export class LoginResponseDto {
  @ApiProperty({
    description: 'Access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @Expose()
  accessToken: string;

  @ApiProperty({
    description: 'User information',
    type: UserInfoResponseDto,
  })
  @Type(() => UserInfoResponseDto)
  @Expose()
  user: UserInfoResponseDto;

  constructor(partial: Partial<LoginResponseDto>) {
    Object.assign(this, partial);
  }
}
