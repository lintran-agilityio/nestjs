// libs
import { Module, Scope } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// database module
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './modules/database/database.module';
import { LoggerModule } from './modules/logger/logger.module';
import { PostModule } from './modules/post/post.module';
import { AppLoggerService } from './modules/logger/logger.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    LoggerModule,
    UserModule,
    AuthModule,
    PostModule,
  ],
  controllers: [],
  providers: [
    {
      provide: AppLoggerService,
      useClass: AppLoggerService,
      scope: Scope.TRANSIENT,
    },
  ],
  exports: [AppLoggerService],
})
export class AppModule {}
