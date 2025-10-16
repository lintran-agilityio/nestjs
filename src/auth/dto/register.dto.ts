// Libs
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Create dto for user registration request
export class RegisterRequestDto {
  @ApiProperty({
    example: 'lin.tran@asnet.com.vn',
    description: 'Unique email of the user',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'P@ssw0rd',
    description: 'Password of the user, minimum length is 6 characters',
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'Lin', description: 'First name of the user' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Tran', description: 'Last name of the user' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: 'USER',
    description: 'Role of the user, either USER or ADMIN',
  })
  @IsString()
  role: 'USER' | 'ADMIN';

  @ApiProperty({
    example: 'ACTIVE',
    description: 'Status of the user, either ACTIVE or INACTIVE',
  })
  @IsString()
  status: 'ACTIVE' | 'INACTIVE';

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

  @ApiProperty({
    type: String,
    description: 'Access token for authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiProperty({
    type: String,
    description: 'Refresh token for obtaining new access tokens',
    example: 'dGhpcyBpcyBhIHNhbXBsZSByZWZyZXNoIHRva2Vu...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;

  @ApiProperty({
    type: String,
    description: 'Token type',
    example: 'Bearer',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['Bearer'])
  tokenType: string;

  @ApiProperty({
    type: String,
    description: 'The expires time',
    example: '20m',
  })
  @IsString()
  @IsNotEmpty()
  expiresIn: string;

  constructor(partial: Partial<RegisterResponseDto>) {
    Object.assign(this, partial);
  }
}
