// Libs
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module, Scope } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

import { JwtAuthGuard, RolesGuard } from '@app/shared/guards';

// database module
import { UserModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './modules/database/database.module';

// App resource
import { LoggerModule } from './modules/logger/logger.module';
import { PostModule } from './modules/posts/posts.module';
import { AppLoggerService } from './modules/logger/logger.service';
import { CommentModule } from './modules/comments/comments.module';
import { RedisModule } from './modules/redis/redis.module';
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
