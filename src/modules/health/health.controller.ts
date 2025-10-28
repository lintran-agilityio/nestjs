// Libs
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

// App sources
import { Public, ApiOkResponseDto } from '@app/shared/decorators';

@Controller('health')
export class HealthController {
  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Health check',
    description: 'Returns service health status',
    type: Object,
  })
  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}
