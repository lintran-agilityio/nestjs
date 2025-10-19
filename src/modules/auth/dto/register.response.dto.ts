// Libs
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Create dto for user registration response
export class RegisterResponseDto {
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
  role: 'USER' | 'ADMIN';

  @ApiProperty({
    type: String,
    description: 'User status',
    example: 'ACTIVE',
  })
  @IsString()
  @IsNotEmpty()
  status: 'ACTIVE' | 'INACTIVE';

  constructor(partial: Partial<RegisterResponseDto>) {
    Object.assign(this, partial);
  }
}
