// libs
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// database module
import { typeOrmConfig } from './config/typeorm.config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmConfig), UserModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
