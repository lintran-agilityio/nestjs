// libs
import {
  Injectable,
  InternalServerErrorException,
  LoggerService,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MESSAGES } from '@app/shared/constants';
import { chunkArray, getSelectFields } from '@app/shared/utils';
import { IMessageAndCountResponse, OrderBy } from '@app/shared/types';
import { Post } from './entities';
import { QueryPaginationParamDto } from '@app/shared/dto';
import { AppLoggerService } from '../logger/logger.service';
import { POST_SELECT_FIELDS } from './config';
import {
  CreateUserPostRequestDto,
  PostPaginationResponseDto,
  UpdateUserPostRequestDto,
  DeletePostsRequestDto,
} from './dto';
import { UserService } from '../user/user.service';
import { generateDeleteMessage } from '@app/shared/utils/generateMessages.utils';
import { BATCH_SIZE } from '@app/shared/common';

@Injectable()
export class PostService {
  private readonly logger: LoggerService;

  constructor(
    private readonly appLoggerServices: AppLoggerService,

    @InjectRepository(Post)
    private readonly postsRepo: Repository<Post>,

    @Inject(forwardRef(() => UserService))
    private readonly usersService: UserService,
  ) {
    // Create context name for logger
    this.logger = this.appLoggerServices.getLoggerName(PostService.name);
  }

  async getPosts(
    queryUrl: QueryPaginationParamDto,
  ): Promise<PostPaginationResponseDto> {
    this.logger.log('Get all posts...');

    try {
      this.logger.warn(`Query get all posts: ${JSON.stringify(queryUrl)}`);
      const { limit, orderBy, page, sortBy, search } = queryUrl;
      const query = {
        limit: limit || 1,
        orderBy: orderBy?.toUpperCase() === 'DESC' ? OrderBy.DESC : OrderBy.ASC,
        page: page || 1,
        sortBy,
        search,
      };
      const numberPage = Number(page) || 1;
      const numberLimit = Number(limit) || 10;
      const skip = (numberPage - 1) * numberLimit;

      this.logger.warn(`Query get all posts: ${JSON.stringify(query)}`);

      // Fields selected
      const selectFields = getSelectFields(POST_SELECT_FIELDS);
      const allowedSortFields = selectFields;
      const sortField = allowedSortFields.includes(sortBy ?? '')
        ? sortBy
        : 'id';

      let queryBuilder = this.postsRepo
        .createQueryBuilder('post')
        .select(selectFields.map((field) => `post.${field}`));

      // Search by (title | contents)
      if (search) {
        queryBuilder = queryBuilder.andWhere(
          '(post.title ILIKE :search OR post.contents ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      // Apply sorting and pagination
      queryBuilder = queryBuilder
        .orderBy(`post.${sortField}`, orderBy)
        .skip(skip)
        .take(limit);

      const [data, total] = await queryBuilder.getManyAndCount();

      this.logger.log(`Get all posts successful: ${JSON.stringify(data)}`);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(
        `[Error] - Get error when get all posts: ${JSON.stringify(error)}`,
      );

      throw new InternalServerErrorException('Server error');
    }
  }

  async getPostsById(id: string): Promise<Post | null> {
    this.logger.warn(`Get post by Id - ${id}...`);
    const post = await this.postsRepo.findOne({
      where: { id },
    });

    if (!post) {
      this.logger.log(`Post not found by: ${id}`);
      throw new NotFoundException(MESSAGES.POST_NOT_FOUND);
    }

    return post;
  }

  async postUsersPost(
    authorId: string,
    postDto: CreateUserPostRequestDto,
  ): Promise<Post> {
    // Show the param to create post
    this.logger.warn(`Param of post ${JSON.stringify(postDto)}`);

    // Find the existed user
    const existedUser = await this.usersService.getUserById(authorId);

    if (!existedUser) {
      this.logger.log(`User not found with ID: ${authorId}`);
      throw new NotFoundException(MESSAGES.USER_NOT_FOUND);
    }

    try {
      return this.postsRepo.save(postDto);
    } catch (error) {
      this.logger.error(`
        [Error] - Error log: ${JSON.stringify(error, null, 2)}
      `);

      throw new InternalServerErrorException('Server error');
    }
  }

  async putUsersPostById(
    id: string,
    updateDto: UpdateUserPostRequestDto,
  ): Promise<Post> {
    this.logger.log(
      `Post id ${id} need to update with body ${JSON.stringify(updateDto)}`,
    );
    const existedPost = await this.getPostsById(id);

    if (existedPost) {
      try {
        existedPost.title = updateDto.title;
        existedPost.contents = updateDto.contents;
        return await this.postsRepo.save(existedPost);
      } catch (error) {
        this.logger.error(`
        [Error] - Error log: ${JSON.stringify(error, null, 2)}
      `);

        throw new InternalServerErrorException('Server error');
      }
    }
  }

  async deleteUsersPostById(id: string): Promise<IMessageAndCountResponse> {
    this.logger.warn(`User will delete Post by id - ${id}`);

    const existedPost = await this.getPostsById(id);

    if (existedPost) {
      try {
        await this.postsRepo.remove(existedPost);

        this.logger.log(`User deleted Post id - ${id} successfully`);

        return { message: MESSAGES.POST_DELETE_SUCCESS };
      } catch (error) {
        this.logger.error(
          `[Error] - delete Post by id - ${id} error ${JSON.stringify(error)}`,
        );
        throw new InternalServerErrorException('Server error');
      }
    }
  }

  /**
   * Bulk delete posts by IDs with comprehensive error handling and validation
   * Uses TypeScript generics and advanced patterns for type safety
   */
  async deletePosts(
    postIdsDto: DeletePostsRequestDto,
  ): Promise<IMessageAndCountResponse> {
    const { postIds } = postIdsDto;

    this.logger.warn(`Post IDs to delete: ${JSON.stringify(postIds)}`);

    try {
      // Find existing posts in batches to avoid memory issues
      const existingPosts = await this.findPostsByIds(postIds);
      const existingPostIds = new Set(existingPosts.map((post) => post.id));

      // Calculate not found IDs
      const notFoundIds = postIds.filter((id) => !existingPostIds.has(id));

      this.logger.log(
        `Found ${existingPosts.length} posts out of ${postIds.length} requested`,
      );

      let deletedCount = 0;
      const deletedIds: string[] = [];

      // Delete posts in batches for better performance
      if (existingPosts.length > 0) {
        const deleteResult = await this.deletePostsInBatches(existingPosts);
        deletedCount = deleteResult.deletedCount;
        deletedIds.push(...deleteResult.deletedIds);
      }

      this.logger.log('Post deleted successfully');

      return {
        message: generateDeleteMessage(deletedCount, notFoundIds.length),
        count: deletedCount,
      };
    } catch (error) {
      this.logger.error(
        `[Error] - Bulk delete posts error: ${JSON.stringify(error, null, 2)}`,
      );
      throw new InternalServerErrorException('Server error');
    }
  }

  /**
   * Find posts by IDs with optimized query
   * Uses TypeScript generics for type safety
   */
  private async findPostsByIds(postIds: string[]): Promise<Post[]> {
    if (postIds.length === 0) {
      return [];
    }

    return await this.postsRepo
      .createQueryBuilder('post')
      .select(['post.id', 'post.title', 'post.authorId'])
      .where('post.id IN (:...postIds)', { postIds })
      .getMany();
  }

  /**
   * Delete posts in batches for better performance
   * Uses TypeScript generics and advanced error handling
   */
  private async deletePostsInBatches(posts: Post[]): Promise<{
    deletedCount: number;
    deletedIds: string[];
  }> {
    const batches = chunkArray(posts, BATCH_SIZE);
    let totalDeletedCount = 0;
    const allDeletedIds: string[] = [];

    for (const batch of batches) {
      try {
        const batchIds = batch.map((post) => post.id);
        await this.postsRepo.delete(batchIds);

        totalDeletedCount += batch.length;
        allDeletedIds.push(...batchIds);

        this.logger.log(`Successfully deleted batch of ${batch.length} posts`);
      } catch (error) {
        this.logger.error(
          `[Error] - Failed to delete batch: ${JSON.stringify(error)}`,
        );
      }
    }

    return {
      deletedCount: totalDeletedCount,
      deletedIds: allDeletedIds,
    };
  }

  /**
   * Delete a specific user's post with comprehensive validation
   * Validates both user existence and post ownership
   * Uses senior TypeScript patterns for type safety and error handling
   */
  async deleteUserPostById(
    userId: string,
    postId: string,
  ): Promise<IMessageAndCountResponse> {
    this.logger.warn(`Deleting post ${postId} for user ${userId}`);

    try {
      // Validate user exists
      const user = await this.usersService.getUserById(userId);
      if (!user) {
        this.logger.log(`User not found with ID: ${userId}`);
        throw new NotFoundException(MESSAGES.USER_NOT_FOUND);
      }

      // Find the post and validate ownership
      const post = await this.postsRepo.findOne({
        where: { id: postId, authorId: userId },
      });

      if (!post) {
        this.logger.log(`Post ${postId} not found for user ${userId}`);
        throw new NotFoundException(MESSAGES.POST_NOT_FOUND);
      }

      // Delete the post
      await this.postsRepo.remove(post);

      this.logger.log(`Successfully deleted post ${postId} for user ${userId}`);

      return {
        message: MESSAGES.POST_DELETE_SUCCESS,
        count: 1,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `[Error] - Failed to delete post ${postId} for user ${userId}: ${JSON.stringify(error, null, 2)}`,
      );
      throw new InternalServerErrorException('Server error');
    }
  }
}
