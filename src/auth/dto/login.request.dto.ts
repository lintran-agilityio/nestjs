// libs
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({
    type: String,
    description: 'Login by email',
    example: 'abc@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({
    type: String,
    description: 'Enter password',
    example: 'abc@123',
  })
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;

  constructor(partial: Partial<LoginRequestDto>) {
    Object.assign(this, partial);
  }
}
