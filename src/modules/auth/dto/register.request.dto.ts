// Libs
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { REGEX, VALIDATION_RULES } from '@app/shared/constants';
import { UserRole, UserStatus } from '@app/shared/types';

const { FIRST_NAME, LAST_NAME, PASSWORD } = VALIDATION_RULES;

// Create dto for user registration request
export class RegisterRequestDto {
  @ApiProperty({
    example: 'lin.tran@asnet.com.vn',
    description: 'Unique email of the user',
  })
  @IsEmail()
  @IsNotEmpty()
  @Matches(REGEX.EMAIL)
  email: string;

  @ApiProperty({
    example: 'P@ssw0rd',
    description: 'Password of the user, minimum length is 6 characters',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(PASSWORD.MIN)
  @MaxLength(PASSWORD.MAX)
  @Matches(REGEX.PASSWORD)
  password: string;

  @ApiProperty({ example: 'Lin', description: 'First name of the user' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(FIRST_NAME.MAX)
  @MinLength(FIRST_NAME.MIN)
  firstName: string;

  @ApiProperty({ example: 'Tran', description: 'Last name of the user' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(LAST_NAME.MAX)
  @MinLength(LAST_NAME.MIN)
  lastName: string;

  @ApiProperty({
    example: 'USER',
    description: 'Role of the user, either USER or ADMIN',
  })
  @IsString()
  role: UserRole;

  @ApiProperty({
    example: 'ACTIVE',
    description: 'Status of the user, either ACTIVE or INACTIVE',
  })
  @IsString()
  status: UserStatus;

  @ApiProperty({
    example: '2023-10-01T12:00:00Z',
    description: 'Timestamp when the user was created',
  })
  createdAt?: Date;

  @ApiProperty({
    example: '2023-10-01T12:00:00Z',
    description: 'Timestamp when the user was last updated',
  })
  updatedAt?: Date;

  constructor(partial: Partial<RegisterRequestDto>) {
    Object.assign(this, partial);
  }
}
