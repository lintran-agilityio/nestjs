// libs
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

import { UserRole, UserStatus } from '@app/shared/types';

export class UserInfoResponseDto {
  @ApiProperty({
    type: String,
    description: 'Id of user',
    example: 'abcd2312-ab12-ab12-aB11-abcd122345678',
  })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({
    type: String,
    description: 'Email login',
    example: 'lin.tran@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    type: String,
    description: 'User role',
    example: 'USER',
  })
  @IsString()
  @IsNotEmpty()
  role: UserRole;

  @ApiProperty({
    type: String,
    description: 'User status',
    example: 'ACTIVE',
  })
  @IsString()
  @IsNotEmpty()
  status: UserStatus;
}
