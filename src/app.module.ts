// Libs
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module, Scope } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

import { JwtAuthGuard, RolesGuard } from '@app/shared/guards';

// database module
import { DatabaseModule } from './shared/modules/database/database.module';

// App resource
import { UserModule } from './apis/users/users.module';
import { AuthModule } from './apis/auth/auth.module';
import { PostModule } from './apis/posts/posts.module';
import { CommentModule } from './apis/comments/comments.module';
import { LoggerModule } from './shared/modules/logger/logger.module';
import { AppLoggerService } from './shared/modules/logger/logger.service';
import { RedisModule } from './shared/modules/redis/redis.module';
import { REDIS_ENV_KEY } from './shared/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PassportModule.register({}),
    DatabaseModule,
    LoggerModule,
    UserModule,
    AuthModule,
    PostModule,
    CommentModule,
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get<string>(REDIS_ENV_KEY.REDIS_HOST, 'localhost'),
        port: configService.get<number>(REDIS_ENV_KEY.REDIS_PORT, 6379),
      }),
      inject: [ConfigService],
    }),
    RedisModule,
  ],
  providers: [
    {
      provide: AppLoggerService,
      useClass: AppLoggerService,
      scope: Scope.TRANSIENT,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [AppLoggerService],
})
export class AppModule {}
