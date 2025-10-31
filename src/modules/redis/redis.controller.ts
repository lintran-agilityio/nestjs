// libs
import { PATHS } from '@app/shared/constants';
import { Controller, Get } from '@nestjs/common';

import { ApiBearerAuth } from '@nestjs/swagger';
import { RedisService } from './redis.service';

@ApiBearerAuth()
@Controller(PATHS.REDIS)
export class RedisController {
  constructor(private readonly redisService: RedisService) {}

  @Get(PATHS.HEALTH_CHECK)
  async checkRedis(): Promise<string> {
    return this.redisService.checkRedisConnection();
  }
}
