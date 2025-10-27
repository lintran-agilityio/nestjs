// Libs
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// App sources
import { CUSTOM_PROVIDER_TOKENS } from '@app/shared/common';
import { BcryptService } from '@app/modules/hashing/bcrypt.service';
import { PostModule } from '@app/modules/posts/posts.module';

// Local sources
import { UserController } from './users.controller';
import { UserService } from './users.service';
import { User } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([User]), forwardRef(() => PostModule)],
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
