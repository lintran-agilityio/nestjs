// Libs
import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';
import { REGEX } from '@app/shared/constants';

export class UuidDto {
  @ApiProperty({
    description: 'Uuid of Dto',
    example: '9dbb7819-4d13-4b0f-8180-028d36b9831f',
  })
  @Matches(REGEX.UUID_ANY)
  id: string;
}
