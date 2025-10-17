// libs
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsIn, IsNotEmpty, IsString } from 'class-validator';

import { UserRole } from '@app/shared/types';

export class LoginResponseDto {
  @ApiProperty({
    type: String,
    description: 'The user email',
    example: 'abc@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({
    type: String,
    description: 'First name of user',
    example: 'Tran',
  })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({
    type: String,
    description: 'Last name of user',
    example: 'A',
  })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({
    type: String,
    description: 'The user role',
    example: 'user',
  })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: string;

  @ApiProperty({
    type: String,
    description: 'The access token',
    example: 'abcd122345678-aB11',
  })
  @IsNotEmpty()
  @IsString()
  accessToken: string;

  @ApiProperty({
    type: String,
    description: 'The refresh token',
    example: 'abcd122345678-aB11',
  })
  refreshToken: string;

  @ApiProperty({
    type: String,
    description: 'Type of token',
    example: 'Bearer',
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['Bearer'])
  tokenType: string;

  @ApiProperty({
    type: String,
    description: 'Expires in',
    example: '15m',
  })
  @IsNotEmpty()
  @IsString()
  expiresIn: string;

  constructor(partial: Partial<LoginResponseDto>) {
    Object.assign(this, partial);
  }
}
