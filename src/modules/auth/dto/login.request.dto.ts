// libs
import { REGEX, VALIDATION_RULES } from '@app/shared/constants';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const { PASSWORD } = VALIDATION_RULES;

export class LoginRequestDto {
  @ApiProperty({
    type: String,
    description: 'Login by email',
    example: 'abc@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  @Matches(REGEX.EMAIL)
  email: string;

  @ApiProperty({
    type: String,
    description: 'Enter password',
    example: 'abc@123',
  })
  @IsNotEmpty()
  @IsStrongPassword()
  @Matches(REGEX.PASSWORD)
  @MaxLength(PASSWORD.MAX)
  @MinLength(PASSWORD.MIN)
  password: string;

  constructor(partial: Partial<LoginRequestDto>) {
    Object.assign(this, partial);
  }
}
