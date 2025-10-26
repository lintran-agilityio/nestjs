// Libs
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

// Local sources
import { UserInfoResponseDto } from './user-info.response.dto';

/**
 * DTO for user login response
 * Contains access token, refresh token, and user information
 */
export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT access token for authenticated requests',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @Expose()
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token for obtaining new access tokens',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @Expose()
  refreshToken: string;

  @ApiProperty({
    description: 'Authenticated user details',
    type: UserInfoResponseDto,
  })
  @Type(() => UserInfoResponseDto)
  @Expose()
  user: UserInfoResponseDto;

  constructor(partial: Partial<LoginResponseDto>) {
    Object.assign(this, partial);
  }
}
