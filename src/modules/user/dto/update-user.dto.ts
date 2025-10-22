import { IntersectionType, PartialType } from '@nestjs/mapped-types';
import { RegisterRequestDto } from '@app/modules/auth/dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UuidDto } from '@app/shared/dto';

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
