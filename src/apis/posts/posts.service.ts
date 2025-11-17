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
import { Brackets, DataSource, EntityManager, Repository } from 'typeorm';

// App sources
import { MESSAGES, REDIS_CACHE_KEYS, TTL_CACHE } from '@app/shared/constants';
import { QueryPaginationParamDto } from '@app/shared/dtos';
import { IMessageAndCountResponse, IUserInfo } from '@app/shared/types';
import {
  deleteItemsInArray,
  generateDeleteMessage,
  getSelectFields,
  getDataPagination,
  handleErrorException,
  validateOwnerRole,
  updateObjectFields,
} from '@app/shared/utils';
import { AppLoggerService } from '@app/shared/modules/logger/logger.service';
import { CacheAbstractService } from '@app/shared/modules/cache/cache.abstract.service';
import { AuditLoggerService } from '@app/shared/modules/audit-logger/audit-logger.service';

// Apis
import { UserService } from '@app/apis/users/users.service';

// Local sources
import { POST_SELECT_FIELDS } from './config';
import {
  DeletePostsRequestDto,
  PostPaginationResponseDto,
  PostRequestDto,
  UpdatePostRequestDto,
} from './dtos';
import { Post } from './entities';

@Injectable()
export class PostService {
  private readonly logger: LoggerService;

  constructor(
    @InjectRepository(Post)
    private readonly postsRepo: Repository<Post>,

    @Inject(forwardRef(() => UserService))
    private readonly usersService: UserService,

    private readonly appLoggerService: AppLoggerService,
    private readonly cacheService: CacheAbstractService,
    private readonly auditLoggerService: AuditLoggerService,
    private readonly dataSource: DataSource,
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
  async getPostsRecently(
    userId: string,
    queryUrl: QueryPaginationParamDto,
  ): Promise<PostPaginationResponseDto> {
    this.logger.log(
      `Get latest posts follow pagination: ${JSON.stringify(queryUrl)}`,
    );

    try {
      // Try cache first using query as part of the key
      const listCacheKey = `${REDIS_CACHE_KEYS.POSTS.LIST}:${JSON.stringify(queryUrl)}`;
      const cached =
        await this.cacheService.getKey<PostPaginationResponseDto>(listCacheKey);
      if (cached) {
        this.logger.log('Posts list served from cache');
        return cached;
      }

      const { search = '' } = queryUrl;

      // Get select fields
      const selectFields = getSelectFields(POST_SELECT_FIELDS);

      // Search by (title | contents)
      const searchValue = search.trim();
      let cacheUpdated = false;

      try {
        const result =
          await this.dataSource.transaction<PostPaginationResponseDto>(
            async (manager) => {
              const transactionalRepo = manager.getRepository(Post);

              // Build query inside transaction
              let queryBuilder = transactionalRepo
                .createQueryBuilder('post')
                .select(selectFields.map((field) => `post.${field}`));

              if (searchValue.length) {
                const normalizedSearch = `%${searchValue.toLowerCase()}%`;

                queryBuilder = queryBuilder.andWhere(
                  new Brackets((qb) =>
                    qb
                      .where('LOWER(post.title) LIKE :search', {
                        search: normalizedSearch,
                      })
                      .orWhere('LOWER(post.contents) LIKE :search', {
                        search: normalizedSearch,
                      }),
                  ),
                );
              }

              const paginatedResult = await getDataPagination<Post>({
                selectFields,
                queryUrl,
                queryBuilder,
                logger: this.logger,
                entity: 'post',
              });

              // Set into Cache before committing so failure triggers rollback
              if (!cacheUpdated) {
                await this.cacheService.setKey(
                  listCacheKey,
                  paginatedResult,
                  TTL_CACHE.POSTS_LIST,
                );
                cacheUpdated = true;
              }

              // Only log audit action if transaction succeeds
              if (userId) {
                await this.auditLoggerService.logAction(
                  {
                    userId,
                    action: 'VIEW_POSTS_RECENTLY',
                    entity: 'Post',
                    data: {
                      query: queryUrl,
                      meta: paginatedResult.meta,
                      servedFromCache: false,
                    },
                  },
                  manager,
                );
              }

              return paginatedResult;
            },
          );

        return result;
      } catch (transactionError) {
        if (cacheUpdated) {
          try {
            await this.cacheService.deleteKey(listCacheKey);
          } catch (cacheCleanupError) {
            this.logger.error(
              `[Cache] - Failed to rollback cache for key ${listCacheKey}: ${JSON.stringify(cacheCleanupError)}`,
            );
          }
        }

        this.logger.error(
          `[Transaction] - Failed to get users list: ${JSON.stringify(transactionError)}`,
        );
        throw transactionError;
      }
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

    // Try cache first
    const slugCacheKey = `${REDIS_CACHE_KEYS.POSTS.BY_SLUG}:${slug}`;
    const cached = await this.cacheService.getKey<Post>(slugCacheKey);
    if (cached) {
      this.logger.log('Post by slug served from cache');
      return cached;
    }

    const post = await this.postsRepo.findOne({
      where: { slug },
    });

    if (post) {
      await this.cacheService.setKey(
        slugCacheKey,
        post,
        TTL_CACHE.POST_BY_SLUG,
      );
    }

    this.logger.log(`Post fetched by slug: ${slug}`);
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
    // Try cache first
    const idCacheKey = `${REDIS_CACHE_KEYS.POSTS.BY_ID}:${id}`;
    const cached = await this.cacheService.getKey<Post>(idCacheKey);
    if (cached) {
      this.logger.log('Post by id served from cache');
      return cached;
    }

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

    if (post) {
      await this.cacheService.setKey(idCacheKey, post, TTL_CACHE.POST_BY_ID);
    }

    this.logger.log(`Post fetched by id: ${id}`);
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
      const newPostCreated = await this.dataSource.transaction<Post>(
        async (manager) => {
          const transactionalRepo = manager.getRepository(Post);

          const newPost = transactionalRepo.create({
            ...postDto,
            authorId,
          });

          const postSaved = await transactionalRepo.save(newPost);

          // Use Audit Logger to log the post creation action
          await this.auditLoggerService.logAction(
            {
              userId: authorId,
              action: 'CREATE_POST',
              entity: 'Post',
              entityId: newPost.id,
              data: {
                post: postSaved,
              },
            },
            manager,
          );

          return postSaved;
        },
      );
      console.log('=================newPostCreated:', newPostCreated);
      // Cache operations outside transaction (non-critical)
      try {
        // Invalidate list caches and set item caches
        await this.cacheService.deleteByPattern(
          `${REDIS_CACHE_KEYS.POSTS.LIST}:*`,
        );
        await this.cacheService.setKey(
          `${REDIS_CACHE_KEYS.POSTS.BY_ID}:${newPostCreated.id}`,
          newPostCreated,
          TTL_CACHE.POST_BY_ID,
        );
        await this.cacheService.setKey(
          `${REDIS_CACHE_KEYS.POSTS.BY_SLUG}:${newPostCreated.slug}`,
          newPostCreated,
          TTL_CACHE.POST_BY_SLUG,
        );
      } catch (cacheError) {
        this.logger.error(
          `[Cache] - Failed cache operations after creating post ${newPostCreated.id}: ${JSON.stringify(cacheError)}`,
        );
      }

      this.logger.log(`Post created successfully: ${newPostCreated.id}`);
      return newPostCreated;
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
  async updateById(
    user: IUserInfo,
    id: string,
    updateDto: UpdatePostRequestDto,
  ): Promise<Post> {
    try {
      const userUpdated = await this.dataSource.transaction<Post>(
        async (manager) => {
          const transactionalRepo = manager.getRepository(Post);
          const existedPost = await this.getById(id);
          const { slug } = updateDto || {};
          const previousSlug = existedPost?.slug;

          // Validate ownership role
          validateOwnerRole(user, existedPost, 'authorId');

          this.logger.log(
            `Post id ${id} need to update with body ${JSON.stringify(updateDto)}`,
          );

          // Ensure there is at least one field to update
          if (!updateDto || !Object.keys(updateDto).length) {
            handleErrorException({
              defaultMessage: MESSAGES.INVALID_REQUEST_BODY,
              ExceptionClass: BadRequestException,
            });
          }

          if (slug && slug !== previousSlug) {
            const duplicated = await this.getBySlug(slug);

            if (duplicated && duplicated.id !== id) {
              this.logger.log(`Post slug already exists: ${slug}`);

              handleErrorException({
                defaultMessage: MESSAGES.POST_SLUG_IS_EXISTED,
                ExceptionClass: BadRequestException,
              });
            }
          }

          if (existedPost) {
            // Merge only defined fields from the request into the existing entity instance
            const postUpdating = updateObjectFields(existedPost, updateDto);

            const saved = await transactionalRepo.save(postUpdating);

            await this.auditLoggerService.logAction({
              userId: user.id,
              action: 'UPDATE_POST',
              entity: 'Post',
              entityId: saved.id,
              data: saved,
            });

            this.logger.log(`Post id - ${id} have update by ${user.role}`);

            return saved;
          }
        },
      );

      return userUpdated;
    } catch (error) {
      this.logger.error(`[Error] - update post error ${JSON.stringify(error)}`);
      handleErrorException({
        error,
        defaultMessage: MESSAGES.UPDATE_POST_FAILED,
      });
    }
  }

  /**
   * Delete a post by ID
   * @param id - The post ID to delete
   * @returns Success message and deletion count
   * @throws NotFoundException if post not found
   * @throws InternalServerErrorException on server error
   */
  async deleteById(
    id: string,
    user: IUserInfo,
  ): Promise<IMessageAndCountResponse> {
    this.logger.log(`Delete Post by id - ${id}`);

    try {
      const deletedPost = await this.dataSource.transaction<Post>(
        async (manager) => {
          const transactionalRepo = manager.getRepository(Post);
          const existedPost = await this.getById(id);

          if (!existedPost) {
            this.logger.log(`Post not found by: ${id}`);

            handleErrorException({
              defaultMessage: MESSAGES.POST_NOT_FOUND,
              ExceptionClass: NotFoundException,
            });
          }

          // Validate ownership role
          validateOwnerRole(user, existedPost, 'authorId');
          await transactionalRepo.remove(existedPost);

          await this.auditLoggerService.logAction({
            userId: user.id,
            action: 'DELETE_POST',
            entity: 'Post',
            entityId: id,
          });

          return existedPost;
        },
      );

      // Invalidate caches
      await this.cacheService.deleteKey(
        `${REDIS_CACHE_KEYS.POSTS.BY_ID}:${id}`,
      );
      await this.cacheService.deleteKey(
        `${REDIS_CACHE_KEYS.POSTS.BY_SLUG}:${deletedPost.slug}`,
      );
      await this.cacheService.deleteByPattern(
        `${REDIS_CACHE_KEYS.POSTS.LIST}:*`,
      );

      this.logger.log(`Post id - ${id} deleted by ${user.role}`);

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

  /**
   * Bulk delete posts by IDs
   * @param postIdsDto - Object containing array of post IDs to delete
   * @returns Success message with deletion count
   * @throws InternalServerErrorException on server error
   */
  async delete(
    userId: string,
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

      // Delete posts in batches for better performance within transaction
      if (existingPosts.length) {
        await this.dataSource.transaction(async (manager: EntityManager) => {
          const transactionalRepo = manager.getRepository(Post);

          // Delete posts using transactional repository
          const deleteResult = await deleteItemsInArray({
            items: existingPosts,
            itemRepository: transactionalRepo,
            logger: this.logger,
          });
          deletedCount = deleteResult.deletedCount;
          deletedIds.push(...deleteResult.deletedIds);

          // Use Audit Logger to log the bulk post deletion action within transaction
          for (const deletedId of deletedIds) {
            await this.auditLoggerService.logAction(
              {
                userId,
                action: 'DELETE_POST',
                entity: 'Post',
                entityId: deletedId,
              },
              manager,
            );
          }
        });

        // Invalidate caches for deleted posts (outside transaction - non-critical)
        try {
          for (const post of existingPosts) {
            await this.cacheService.deleteKey(
              `${REDIS_CACHE_KEYS.POSTS.BY_ID}:${post.id}`,
            );
            // We don't have slug selected here; ignore slug invalidation in bulk
          }
          await this.cacheService.deleteByPattern(
            `${REDIS_CACHE_KEYS.POSTS.LIST}:*`,
          );
        } catch (cacheError) {
          this.logger.error(
            `[Cache] - Failed to invalidate cache after bulk delete: ${JSON.stringify(cacheError)}`,
          );
        }
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
  async deletePostById(userId: string, postId: string): Promise<void> {
    this.logger.log(`Deleting post ${postId} for user ${userId}`);

    try {
      // Validate user exists
      await this.usersService.getById(userId);

      await this.dataSource.transaction(async (manager: EntityManager) => {
        const transactionalRepo = manager.getRepository(Post);

        // Find the post and validate ownership using transactional repository
        const post = await transactionalRepo.findOne({
          where: { id: postId, authorId: userId },
        });

        if (!post) {
          this.logger.log(`Post ${postId} not found for user ${userId}`);

          handleErrorException({
            defaultMessage: MESSAGES.POST_NOT_FOUND,
            ExceptionClass: NotFoundException,
          });
        }

        await transactionalRepo.remove(post);

        // Use Audit Logger to log the post deletion action within transaction
        await this.auditLoggerService.logAction(
          {
            userId,
            action: 'DELETE_POST',
            entity: 'Post',
            entityId: postId,
          },
          manager,
        );
      });

      this.logger.log(`Successfully deleted post ${postId} for user ${userId}`);

      // Invalidate caches
      await this.cacheService.deleteKey(
        `${REDIS_CACHE_KEYS.POSTS.BY_ID}:${postId}`,
      );
      await this.cacheService.deleteByPattern(
        `${REDIS_CACHE_KEYS.POSTS.LIST}:*`,
      );
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

  /**
   * Get all posts of a specific user with default pagination
   * - Validates the user exists
   * - Filters posts by authorId
   * - Applies default pagination/sorting via getDataPagination
   * - Caches the list result per user
   * @param userId - Owner user id
   * @returns Paginated posts belonging to the user
   */
  async getAllPostOfUser(userId: string): Promise<PostPaginationResponseDto> {
    this.logger.log(`Get all posts of user ${userId}`);

    try {
      // Ensure the user exists
      await this.usersService.getById(userId);

      // Try cache first (defaults: page=1, limit=10, sort=createdAt ASC)
      const cacheKey = `${REDIS_CACHE_KEYS.POSTS.LIST}:byUser:${userId}`;
      const cached =
        await this.cacheService.getKey<PostPaginationResponseDto>(cacheKey);
      if (cached) {
        this.logger.log('User posts list served from cache');
        return cached;
      }

      // Get select fields
      const selectFields = getSelectFields(POST_SELECT_FIELDS);
      let cacheUpdated = false;

      try {
        const result =
          await this.dataSource.transaction<PostPaginationResponseDto>(
            async (manager: EntityManager) => {
              const transactionalRepo = manager.getRepository(Post);

              // Build query inside transaction
              const queryBuilder = transactionalRepo
                .createQueryBuilder('post')
                .select(selectFields.map((field) => `post.${field}`))
                .where('post.authorId = :userId', { userId });

              // Use default pagination params (page=1, limit=10, sort=createdAt)
              const paginatedResult = await getDataPagination<Post>({
                selectFields,
                queryUrl: {},
                queryBuilder,
                logger: this.logger,
                entity: 'post',
              });

              // Set into Cache before committing so failure triggers rollback
              if (!cacheUpdated) {
                await this.cacheService.setKey(
                  cacheKey,
                  paginatedResult,
                  TTL_CACHE.POSTS_LIST,
                );
                cacheUpdated = true;
              }

              // Log audit action within transaction
              await this.auditLoggerService.logAction(
                {
                  userId,
                  action: 'VIEW_USER_POSTS',
                  entity: 'Post',
                  data: {
                    requestedUserId: userId,
                    meta: paginatedResult.meta,
                    servedFromCache: false,
                  },
                },
                manager,
              );

              return paginatedResult;
            },
          );

        this.logger.log(`Fetched all posts of user ${userId} successfully`);
        return result;
      } catch (transactionError) {
        if (cacheUpdated) {
          try {
            await this.cacheService.deleteKey(cacheKey);
          } catch (cacheCleanupError) {
            this.logger.error(
              `[Cache] - Failed to rollback cache for key ${cacheKey}: ${JSON.stringify(cacheCleanupError)}`,
            );
          }
        }

        this.logger.error(
          `[Transaction] - Failed to get user posts: ${JSON.stringify(transactionError)}`,
        );
        throw transactionError;
      }
    } catch (error) {
      this.logger.error(
        `[Error] - Get error when get all posts of user ${userId}: ${JSON.stringify(
          error,
        )}`,
      );

      handleErrorException({
        error,
        defaultMessage: MESSAGES.GET_POST_FAILED,
      });
    }
  }
}
