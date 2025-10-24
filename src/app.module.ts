// libs
import { Module, Scope } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

// database module
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './modules/database/database.module';
import { LoggerModule } from './modules/logger/logger.module';
import { PostModule } from './modules/post/post.module';
import { AppLoggerService } from './modules/logger/logger.service';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './shared/guard';
import { JwtAuthGuard } from './shared/guard/jwt.guard';

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
