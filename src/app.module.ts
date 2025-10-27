// Libs
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { Module, Scope } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

// database module
import { UserModule } from './modules/user/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './modules/database/database.module';
import { LoggerModule } from './modules/logger/logger.module';
import { PostModule } from './modules/posts/posts.module';
import { AppLoggerService } from './modules/logger/logger.service';
import { CommentModule } from './modules/comments/comments.module';

import { JwtAuthGuard, RolesGuard } from '@app/shared/guards';

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
