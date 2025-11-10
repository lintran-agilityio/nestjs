// Libs
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// App sources
import { CUSTOM_PROVIDER_TOKENS } from '@app/shared/common';
import { BcryptService } from '@app/shared/modules/hashing/bcrypt.service';
import { PostModule } from '@app/apis/posts/posts.module';
import { CacheModule } from '@app/shared/modules/cache/cache.module';

// Local sources
import { UserController } from './users.controller';
import { UserService } from './users.service';
import { User } from './entities';
import { CacheProvider } from '@app/shared/types';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => PostModule),
    CacheModule.register(CacheProvider.REDIS),
  ],
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
