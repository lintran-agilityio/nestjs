// Libs
import { ApiProperty } from '@nestjs/swagger';

// App sources
import { MetadataResponseDto } from '@app/shared/dto';
import { IPaginationResponse } from '@app/shared/interfaces';

// Local sources
import { User } from '../entities';

export class UserResponseDto implements IPaginationResponse<User> {
  @ApiProperty({
    description: 'List of User info',
    type: [User],
  })
  data: User[];

  @ApiProperty({
    description: 'Metadata pagination',
    type: MetadataResponseDto,
  })
  meta: MetadataResponseDto;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
