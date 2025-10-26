// Libs
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

// App sources
import { UserRole, UserStatus } from '@app/shared/types';

/**
 * DTO for user registration response
 * Contains created user information after successful registration
 */
export class RegisterResponseDto {
  @ApiProperty({
    type: String,
    description: 'Unique identifier of the user',
    example: 'abcd2312-ab12-ab12-aB11-abcd122345678',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  id: string;

  @ApiProperty({
    type: String,
    description: 'Email address of the registered user',
    example: 'some.one@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    type: String,
    description: 'User role (USER or ADMIN)',
    example: 'USER',
  })
  @IsString()
  @IsNotEmpty()
  role: UserRole;

  @ApiProperty({
    type: String,
    description: 'User status (ACTIVE or INACTIVE)',
    example: 'ACTIVE',
  })
  @IsString()
  @IsNotEmpty()
  status: UserStatus;

  constructor(partial: Partial<RegisterResponseDto>) {
    Object.assign(this, partial);
  }
}
