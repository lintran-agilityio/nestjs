// Libs
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

// App sources
import { REGEX } from '@app/shared/constants';

/**
 * DTO for user login request
 * Contains email and password for authentication
 */
export class LoginRequestDto {
  @ApiProperty({
    type: String,
    description: 'User email address for authentication',
    example: 'abc@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  @Matches(REGEX.EMAIL)
  email: string;

  @ApiProperty({
    type: String,
    description: 'User password for authentication',
    example: 'abc@123',
  })
  @IsNotEmpty()
  password: string;

  constructor(partial: Partial<LoginRequestDto>) {
    Object.assign(this, partial);
  }
}
