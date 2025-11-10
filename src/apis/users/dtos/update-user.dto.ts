// Libs
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IntersectionType, PartialType } from '@nestjs/mapped-types';
import { IsArray, ValidateNested } from 'class-validator';

// App sources
import { UuidDto } from '@app/shared/dtos';
import { RegisterRequestDto } from '@app/apis/auth/dto';

export class UpdateUserByIdDto extends PartialType(RegisterRequestDto) {}

export class UpdateUserDto extends IntersectionType(
  PartialType(RegisterRequestDto),
  UuidDto,
) {}

export class UpdateAllUsersDto {
  @ApiProperty({
    type: [UpdateUserDto],
    description: 'Update information all of users',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateUserDto)
  users: UpdateUserDto[];
}
