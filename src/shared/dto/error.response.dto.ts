import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ErrorResponseDto {
  @ApiProperty({
    type: String,
    description: 'The error messages',
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    type: String,
    description: 'The error code',
  })
  @IsNotEmpty()
  @IsString()
  error: string;
}
