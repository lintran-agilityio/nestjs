// Libs
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

// App sources
import { Public } from '@app/shared/decorators';
import { PATHS } from '@app/shared/constants';

@Controller()
export class HealthController {
  @Get(PATHS.HEALTH_CHECK)
  @Public()
  @HttpCode(HttpStatus.OK)
  health() {
    return { status: 'ok' };
  }
}
