// libs
import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UuidDto {
  @ApiProperty({
    description: 'Uuid of Dto',
    example: '9dbb7819-4d13-4b0f-8180-028d36b9831f',
  })
  @IsUUID()
  id: string;
}
