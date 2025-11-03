// Libs
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { Module, Scope } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

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
import { CacheModule } from './shared/modules/cache/cache.module';
import { CacheProvider } from './shared/types';

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

    // Config Redis cache
    CacheModule.register(CacheProvider.REDIS),
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
