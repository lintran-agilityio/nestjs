// libs
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities';
import { CUSTOM_PROVIDER_TOKENS } from '@app/shared/common';
import { BcryptService } from '../hashing/bcrypt.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: CUSTOM_PROVIDER_TOKENS.PASSWORD_HASHING_SERVICE,
      useClass: BcryptService,
    },
  ],
  exports: [UserService],
})
export class UserModule {}
