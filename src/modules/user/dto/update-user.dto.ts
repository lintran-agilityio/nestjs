// Libs
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IntersectionType, PartialType } from '@nestjs/mapped-types';
import { IsArray, ValidateNested } from 'class-validator';

// App sources
import { UuidDto } from '@app/shared/dto';
import { RegisterRequestDto } from '@app/modules/auth/dto';

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

  constructor(partial: Partial<UpdateAllUsersDto>) {
    Object.assign(this, partial);
  }
}
