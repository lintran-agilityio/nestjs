// libs
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Local sources
import { Comment } from './entities';
import { CommentService } from './comments.service';
import { CommentController } from './comments.controller';
import { UserModule } from '../users/users.module';
import { PostModule } from '../posts/posts.module';
import { CacheProvider } from '@app/shared/types';

// App source
import { CacheModule } from '@app/shared/modules/cache/cache.module';

/**
 * Comment Module
 * Manages comments on posts with proper dependency injection
 * Imports UserModule and PostModule to access their services
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Comment]),
    forwardRef(() => UserModule),
    forwardRef(() => PostModule),
    CacheModule.register(CacheProvider.MEMORY),
  ],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
