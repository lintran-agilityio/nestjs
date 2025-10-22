import { ApiPropertyOptional } from '@nestjs/swagger';

export class DeleteAllUsersDto {
  @ApiPropertyOptional({
    description:
      'Optional filter — e.g., delete users by role or condition in the future',
    example: null,
  })
  filter?: Record<string, any>;
}
