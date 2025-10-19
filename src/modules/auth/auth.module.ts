// libs
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '@app/modules/user/entities';
import { HashingService } from '@app/modules/hashing/hashing.service';
import { BcryptService } from '@app/modules/hashing/bcrypt.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: HashingService,
      useClass: BcryptService,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
