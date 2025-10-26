// Libs
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// App sources
import { UserModule } from '@app/modules/user/user.module';

// Local sources
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { Post } from './entities';

/**
 * Post module
 * Handles CRUD operations for posts
 * Manages user-post relationships and bulk operations
 */
@Module({
  imports: [TypeOrmModule.forFeature([Post]), forwardRef(() => UserModule)],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
