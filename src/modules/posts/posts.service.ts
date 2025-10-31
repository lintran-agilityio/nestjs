// Libs
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// App sources
import { MESSAGES } from '@app/shared/constants';
import { QueryPaginationParamDto } from '@app/shared/dtos';
import { IMessageAndCountResponse } from '@app/shared/types';
import {
  deleteItemsInArray,
  generateDeleteMessage,
  getSelectFields,
  getDataPagination,
} from '@app/shared/utils';
import { AppLoggerService } from '@app/modules/logger/logger.service';
import { UserService } from '@app/modules/users/users.service';

// Local sources
import { POST_SELECT_FIELDS } from './config';
import {
  DeletePostsRequestDto,
  PostPaginationResponseDto,
  PostRequestDto,
} from './dtos';
import { Post } from './entities';
import { handleErrorException } from '@app/shared/utils/error.utils';

@Injectable()
export class PostService {
  private readonly logger: LoggerService;

  constructor(
    @InjectRepository(Post)
    private readonly postsRepo: Repository<Post>,

    @Inject(forwardRef(() => UserService))
    private readonly usersService: UserService,

    private readonly appLoggerService: AppLoggerService,
  ) {
    // Create context name for logger
    this.logger = this.appLoggerService.getLoggerName(PostService.name);
  }

  /**
   * Get all posts with pagination
   * @param queryUrl - Query parameters for pagination, sorting, and filtering
   * @returns Paginated list of posts with metadata
   * @throws InternalServerErrorException on server error
   */
  async getAll(
    queryUrl: QueryPaginationParamDto,
  ): Promise<PostPaginationResponseDto> {
    this.logger.log('Get all posts...');

    try {
      this.logger.log(`Query get all posts: ${JSON.stringify(queryUrl)}`);

      const { search } = queryUrl;

      // Get select fields
      const selectFields = getSelectFields(POST_SELECT_FIELDS);

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

      return await getDataPagination<Post>({
        selectFields,
        queryUrl,
        queryBuilder,
        logger: this.logger,
        entity: 'post',
      });
    } catch (error) {
      this.logger.error(
        `[Error] - Get error when get all posts: ${JSON.stringify(error)}`,
      );

      handleErrorException({
        error,
        defaultMessage: MESSAGES.GET_POST_FAILED,
      });
    }
  }

  /**
   * Get a post by slug
   * @param slug - The post slug
   * @returns Post details or null if not found
   * @throws NotFoundException if post not found
   */
  async getBySlug(slug: string): Promise<Post | null> {
    this.logger.log(`Get post by Id - ${slug}...`);
    const post = await this.postsRepo.findOne({
      where: { slug },
    });

    return post;
  }

  /**
   * Get a post by ID
   * @param id - The post ID
   * @returns Post details or null if not found
   * @throws NotFoundException if post not found
   */
  async getById(id: string): Promise<Post | null> {
    this.logger.log(`Get post by Id - ${id}...`);
    const post = await this.postsRepo.findOne({
      where: { id },
    });

    if (!post) {
      this.logger.log(`Post not found by: ${id}`);

      handleErrorException({
        defaultMessage: MESSAGES.POST_NOT_FOUND,
        ExceptionClass: NotFoundException,
      });
    }

    return post;
  }

  /**
   * Create a new post for a user
   * @param authorId - The author's user ID
   * @param postDto - Post creation data
   * @returns Created post
   * @throws NotFoundException if user not found
   * @throws InternalServerErrorException on server error
   */
  async create(authorId: string, postDto: PostRequestDto): Promise<Post> {
    this.logger.log(`Param of post ${JSON.stringify(postDto)}`);

    // Find the existed user
    await this.usersService.getById(authorId);

    const post = await this.getBySlug(postDto.slug);

    if (post) {
      this.logger.log(`Post slug already exists: ${postDto.slug}`);

      handleErrorException({
        defaultMessage: MESSAGES.POST_SLUG_IS_EXISTED,
        ExceptionClass: NotFoundException,
      });
    }

    try {
      return this.postsRepo.save({
        ...postDto,
        authorId,
      });
    } catch (error) {
      this.logger.error(`
        [Error] - Error log: ${JSON.stringify(error, null, 2)}
      `);

      handleErrorException({
        error,
        defaultMessage: MESSAGES.CREATE_POST_FAILED,
      });
    }
  }

  /**
   * Update an existing post by ID
   * @param id - The post ID to update
   * @param updateDto - Updated post data
   * @returns Updated post
   * @throws NotFoundException if post not found
   * @throws InternalServerErrorException on server error
   */
  async updateById(id: string, updateDto: PostRequestDto): Promise<Post> {
    this.logger.log(
      `Post id ${id} need to update with body ${JSON.stringify(updateDto)}`,
    );

    // Validate required fields explicitly to ensure 400 on invalid body
    if (
      !updateDto ||
      !updateDto.slug ||
      !updateDto.title ||
      !updateDto.contents
    ) {
      handleErrorException({
        defaultMessage: MESSAGES.INVALID_REQUEST_BODY,
        ExceptionClass: BadRequestException,
      });
    }

    const existedPost = await this.getById(id);

    if (existedPost) {
      try {
        existedPost.title = updateDto.title;
        existedPost.contents = updateDto.contents;
        return await this.postsRepo.save(existedPost);
      } catch (error) {
        this.logger.error(`
        [Error] - Error log: ${JSON.stringify(error, null, 2)}
      `);

        handleErrorException({
          error,
          defaultMessage: MESSAGES.UPDATE_POST_FAILED,
        });
      }
    }
  }

  /**
   * Delete a post by ID
   * @param id - The post ID to delete
   * @returns Success message and deletion count
   * @throws NotFoundException if post not found
   * @throws InternalServerErrorException on server error
   */
  async deleteById(id: string): Promise<IMessageAndCountResponse> {
    this.logger.log(`User will delete Post by id - ${id}`);

    const existedPost = await this.getById(id);

    if (existedPost) {
      try {
        await this.postsRepo.remove(existedPost);

        this.logger.log(`User deleted Post id - ${id} successfully`);

        return { message: MESSAGES.POST_DELETE_SUCCESS };
      } catch (error) {
        this.logger.error(
          `[Error] - delete Post by id - ${id} error ${JSON.stringify(error)}`,
        );

        handleErrorException({
          error,
          defaultMessage: MESSAGES.DELETED_POST_FAILED,
        });
      }
    }
  }

  /**
   * Bulk delete posts by IDs
   * @param postIdsDto - Object containing array of post IDs to delete
   * @returns Success message with deletion count
   * @throws InternalServerErrorException on server error
   */
  async delete(
    postIdsDto: DeletePostsRequestDto,
  ): Promise<IMessageAndCountResponse> {
    const { postIds } = postIdsDto;

    this.logger.log(`Post IDs to delete: ${JSON.stringify(postIds)}`);

    try {
      // Find existing posts in batches to avoid memory issues
      const existingPosts = await this.findByIds(postIds);
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
        const deleteResult = await deleteItemsInArray({
          items: existingPosts,
          itemRepository: this.postsRepo,
          logger: this.logger,
        });
        deletedCount = deleteResult.deletedCount;
        deletedIds.push(...deleteResult.deletedIds);
      }

      this.logger.log('Post deleted successfully');

      return {
        message: generateDeleteMessage(
          'post',
          deletedCount,
          notFoundIds.length,
        ),
        count: deletedCount,
      };
    } catch (error) {
      this.logger.error(
        `[Error] - Bulk delete posts error: ${JSON.stringify(error, null, 2)}`,
      );

      handleErrorException({
        error,
        defaultMessage: MESSAGES.DELETED_POST_FAILED,
      });
    }
  }

  /**
   * Find posts by their IDs with optimized query
   * @param postIds - Array of post IDs to find
   * @returns Array of found posts
   */
  private async findByIds(postIds: string[]): Promise<Post[]> {
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
   * Delete a specific user's post with validation
   * @param userId - The user ID who owns the post
   * @param postId - The post ID to delete
   * @returns Success message with deletion count
   * @throws NotFoundException if user or post not found
   * @throws InternalServerErrorException on server error
   */
  async deleteUserPostById(
    userId: string,
    postId: string,
  ): Promise<IMessageAndCountResponse> {
    this.logger.log(`Deleting post ${postId} for user ${userId}`);

    try {
      // Validate user exists
      await this.usersService.getById(userId);

      // Find the post and validate ownership
      const post = await this.postsRepo.findOne({
        where: { id: postId, authorId: userId },
      });

      if (!post) {
        this.logger.log(`Post ${postId} not found for user ${userId}`);

        handleErrorException({
          defaultMessage: MESSAGES.POST_NOT_FOUND,
          ExceptionClass: NotFoundException,
        });
      }

      // Delete the post
      await this.postsRepo.remove(post);

      this.logger.log(`Successfully deleted post ${postId} for user ${userId}`);

      return {
        message: MESSAGES.POST_DELETE_SUCCESS,
        count: 1,
      };
    } catch (error) {
      // Preserve NotFoundException if it was thrown
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `[Error] - Failed to delete post ${postId} for user ${userId}: ${JSON.stringify(error, null, 2)}`,
      );

      handleErrorException({
        error,
        defaultMessage: MESSAGES.DELETED_POST_FAILED,
      });
    }
  }
}
