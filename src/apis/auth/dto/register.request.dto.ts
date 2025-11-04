// Libs
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

// App sources
import { REGEX, VALIDATION_RULES } from '@app/shared/constants';

const { FIRST_NAME, LAST_NAME, PASSWORD } = VALIDATION_RULES;

/**
 * DTO for user registration request
 * Contains user details for creating a new account
 */
export class RegisterRequestDto {
  @ApiProperty({
    example: 'some.one@gmail.com',
    description: 'The email address of the user',
  })
  @IsEmail()
  @IsNotEmpty()
  @Matches(REGEX.EMAIL)
  email: string;

  @ApiProperty({
    example: 'P@ssw0rd',
    description: 'User password (minimum 6 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(PASSWORD.MIN)
  @MaxLength(PASSWORD.MAX)
  @Matches(REGEX.PASSWORD)
  password: string;

  @ApiProperty({
    example: 'Lin',
    description: "User's first name",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(FIRST_NAME.MAX)
  @MinLength(FIRST_NAME.MIN)
  firstName: string;

  @ApiProperty({
    example: 'Tran',
    description: "User's last name",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(LAST_NAME.MAX)
  @MinLength(LAST_NAME.MIN)
  lastName: string;

  @ApiProperty({
    example: '2023-10-01T12:00:00Z',
    description: 'Account creation timestamp',
  })
  createdAt?: Date;

  @ApiProperty({
    example: '2023-10-01T12:00:00Z',
    description: 'Account last update timestamp',
  })
  updatedAt?: Date;

  constructor(partial: Partial<RegisterRequestDto>) {
    Object.assign(this, partial);
  }
}
