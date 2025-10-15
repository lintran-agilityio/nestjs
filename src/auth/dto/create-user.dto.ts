// Libs
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
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
}
