import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { UserModule } from '../user/user.module';
import { PostModule } from '../post/post.module';

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
  ],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule {}
