// Libs
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// App sources
import { UserModule } from '@app/apis/users/users.module';
import { CacheProvider } from '@app/shared/types';
import { CacheModule } from '@app/shared/modules/cache/cache.module';
import { AuditLoggerModule } from '@app/shared/modules/audit-logger/audit-logger.module';

// Local sources
import { PostController } from './posts.controller';
import { PostService } from './posts.service';
import { Post } from './entities';

/**
 * Post module
 * Handles CRUD operations for posts
 * Manages user-post relationships and bulk operations
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Post]),
    forwardRef(() => UserModule),
    CacheModule.register(CacheProvider.REDIS),
    AuditLoggerModule,
  ],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
