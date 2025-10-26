import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Post]), forwardRef(() => UserModule)],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
