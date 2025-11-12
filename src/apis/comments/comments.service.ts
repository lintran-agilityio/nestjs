// libs
import {
  Injectable,
  LoggerService,
  NotFoundException,
  Inject,
  forwardRef,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MESSAGES, REDIS_CACHE_KEYS, TTL_CACHE } from '@app/shared/constants';
import {
  getSelectFields,
  deleteItemsInArray,
  generateDeleteMessage,
  getDataPagination,
  handleErrorException,
} from '@app/shared/utils';
import {
  IMessageAndCountResponse,
  IUserInfo,
  UserRole,
} from '@app/shared/types';
import { Comment } from './entities';
import { COMMENT_SELECT_FIELDS } from './config';
import { UserService } from '../users/users.service';
import { PostService } from '../posts/posts.service';
import { AppLoggerService } from '@app/shared/modules/logger/logger.service';
import { CacheAbstractService } from '@app/shared/modules/cache/cache.abstract.service';
import {
  CreateCommentRequestDto,
  UpdateCommentRequestDto,
  CommentPaginationResponseDto,
  QueryCommentParamDto,
  DeleteCommentsRequestDto,
} from './dtos';

/**
 * Comment Service
 * Handles all comment-related business logic with senior TypeScript patterns
 * Includes comprehensive error handling, pagination, and batch operations
 */
@Injectable()
export class CommentService {
  private readonly logger: LoggerService;

  constructor(
    private readonly appLoggerServices: AppLoggerService,

    @InjectRepository(Comment)
    private readonly commentsRepo: Repository<Comment>,

    @Inject(forwardRef(() => UserService))
    private readonly usersService: UserService,

    @Inject(forwardRef(() => PostService))
    private readonly postService: PostService,

    private readonly cacheService: CacheAbstractService,
  ) {
    // Create context name for logger
    this.logger = this.appLoggerServices.getLoggerName(CommentService.name);
  }

  /**
   * Get all comments with pagination and filtering
   * Supports filtering by postId
   */
  async getCommentsRecently(
    queryUrl: QueryCommentParamDto,
  ): Promise<CommentPaginationResponseDto> {
    this.logger.log('Get all comments...');

    try {
      this.logger.warn(`Query get all comments: ${JSON.stringify(queryUrl)}`);

      // Try cache first using query as part of the key
      const listCacheKey = `${REDIS_CACHE_KEYS.COMMENTS.LIST}:${JSON.stringify(
        queryUrl,
      )}`;
      const cached =
        await this.cacheService.getKey<CommentPaginationResponseDto>(
          listCacheKey,
        );
      if (cached) {
        this.logger.log('Comments list served from cache');
        return cached;
      }

      const { search, postId } = queryUrl;

      // Get select fields from config
      const selectFields = getSelectFields(COMMENT_SELECT_FIELDS);

      // Build query
      let queryBuilder = this.commentsRepo
        .createQueryBuilder('comment')
        .leftJoinAndSelect('comment.user', 'user')
        .leftJoinAndSelect('comment.post', 'post')
        .select(selectFields.map((field) => `comment.${field}`));

      // Filter by postId if provided
      if (postId) {
        queryBuilder = queryBuilder.andWhere('comment.postId = :postId', {
          postId,
        });
      }

      // Search by content
      const searchValue = search?.trim();

      if (searchValue) {
        const normalizedSearch = `%${searchValue}%`;

        queryBuilder = queryBuilder.andWhere('comment.content ILIKE :search', {
          search: normalizedSearch,
        });
      }

      const result = await getDataPagination<Comment>({
        selectFields,
        queryUrl,
        queryBuilder,
        logger: this.logger,
        entity: 'comment',
      });

      // Cache the result
      await this.cacheService.setKey(
        listCacheKey,
        result,
        TTL_CACHE.COMMENTS_LIST,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `[Error] - Get error when get all comments: ${JSON.stringify(error)}`,
      );

      handleErrorException({
        error,
        defaultMessage: MESSAGES.GET_COMMENT_FAILED,
      });
    }
  }

  /**
   * Get comment by ID
   * Includes user and post relationships
   */
  async getCommentById(id: string): Promise<Comment> {
    this.logger.warn(`Get comment by Id - ${id}...`);
    // Try cache first
    const idCacheKey = `${REDIS_CACHE_KEYS.COMMENTS.BY_ID}:${id}`;
    const cached = await this.cacheService.getKey<Comment>(idCacheKey);
    if (cached) {
      this.logger.log('Comment by id served from cache');
      return cached;
    }

    const comment = await this.commentsRepo.findOne({
      where: { id },
      select: {
        user: {
          id: true,
          firstName: true,
          lastName: true,
        },
        post: {
          id: true,
          title: true,
        },
      },
      relations: {
        user: true,
        post: true,
      },
    });

    if (!comment) {
      this.logger.log(`Comment not found by: ${id}`);
      handleErrorException({
        defaultMessage: MESSAGES.COMMENT_NOT_FOUND,
        ExceptionClass: NotFoundException,
      });
    }

    // Cache the comment before returning
    await this.cacheService.setKey(
      idCacheKey,
      comment,
      TTL_CACHE.COMMENT_BY_ID,
    );

    return comment;
  }

  /**
   * Create a new comment on a post
   * Validates user and post existence
   */
  async createComment(
    userId: string,
    createCommentDto: CreateCommentRequestDto,
  ): Promise<Comment> {
    this.logger.warn(
      `Creating comment for user ${userId} on post ${createCommentDto.postId}`,
    );

    const { postId, content } = createCommentDto;
    // Validate user exists - throws NotFoundException if not found
    await this.usersService.getById(userId);

    // Validate post exists - throws NotFoundException if not found
    await this.postService.getById(postId);

    try {
      const comment = this.commentsRepo.create({
        content,
        userId,
        postId,
      });

      const savedComment = await this.commentsRepo.save(comment);

      this.logger.log(`Comment created successfully: ${savedComment.id}`);

      // Invalidate list caches and set item cache
      await this.cacheService.deleteByPattern(
        `${REDIS_CACHE_KEYS.COMMENTS.LIST}:*`,
      );
      await this.cacheService.setKey(
        `${REDIS_CACHE_KEYS.COMMENTS.BY_ID}:${savedComment.id}`,
        savedComment,
        TTL_CACHE.COMMENT_BY_ID,
      );

      return savedComment;
    } catch (error) {
      this.logger.error(
        `[Error] - Error creating comment: ${JSON.stringify(error)}`,
      );

      handleErrorException({
        error,
        defaultMessage: MESSAGES.CREATE_COMMENT_FAILED,
      });
    }
  }

  /**
   * Update comment by ID
   * Validates comment ownership
   */
  async updateCommentById(
    id: string,
    userId: string,
    updateDto: UpdateCommentRequestDto,
  ): Promise<Comment> {
    this.logger.log(`Comment id ${id} need to update by user ${userId}`);

    const comment = await this.getCommentById(id);

    // Check if user owns the comment
    if (comment.userId !== userId) {
      this.logger.warn(
        `User ${userId} attempted to update comment ${id} owned by ${comment.userId}`,
      );

      handleErrorException({
        defaultMessage: MESSAGES.COMMENT_NO_AUTHORIZED,
        ExceptionClass: UnauthorizedException,
      });
    }

    try {
      comment.content = updateDto.content;
      const updatedComment = await this.commentsRepo.save(comment);

      this.logger.log(`Comment ${id} updated successfully`);

      // Invalidate caches
      await this.cacheService.deleteKey(
        `${REDIS_CACHE_KEYS.COMMENTS.BY_ID}:${id}`,
      );
      await this.cacheService.deleteByPattern(
        `${REDIS_CACHE_KEYS.COMMENTS.LIST}:*`,
      );
      // Refresh item cache
      await this.cacheService.setKey(
        `${REDIS_CACHE_KEYS.COMMENTS.BY_ID}:${updatedComment.id}`,
        updatedComment,
        TTL_CACHE.COMMENT_BY_ID,
      );

      return updatedComment;
    } catch (error) {
      this.logger.error(
        `[Error] - Error updating comment: ${JSON.stringify(error)}`,
      );

      handleErrorException({
        error,
        defaultMessage: MESSAGES.UPDATE_COMMENT_FAILED,
      });
    }
  }

  /**
   * Delete comment by ID
   * Validates comment ownership
   */
  async deleteCommentById(
    id: string,
    user: IUserInfo,
  ): Promise<IMessageAndCountResponse> {
    const userId = user.id;
    this.logger.warn(`User ${userId} will delete comment id - ${id}`);

    const comment = await this.getCommentById(id);

    // Check if user owns the comment
    if (user.role !== UserRole.ADMIN && comment.userId !== userId) {
      this.logger.warn(
        `User ${userId} attempted to delete comment ${id} owned by ${comment.userId}`,
      );

      handleErrorException({
        defaultMessage: MESSAGES.COMMENT_NO_AUTHORIZED,
        ExceptionClass: UnauthorizedException,
      });
    }

    try {
      await this.commentsRepo.remove(comment);

      this.logger.log(`Comment ${id} deleted successfully`);

      // Invalidate caches
      await this.cacheService.deleteKey(
        `${REDIS_CACHE_KEYS.COMMENTS.BY_ID}:${id}`,
      );
      await this.cacheService.deleteByPattern(
        `${REDIS_CACHE_KEYS.COMMENTS.LIST}:*`,
      );

      return { message: MESSAGES.COMMENT_DELETE_SUCCESS };
    } catch (error) {
      this.logger.error(
        `[Error] - Error deleting comment: ${JSON.stringify(error)}`,
      );

      handleErrorException({
        error,
        defaultMessage: MESSAGES.DELETE_COMMENT_FAILED,
      });
    }
  }

  /**
   * Delete comments by IDs
   * Uses TypeScript generics and batch processing for performance
   */
  async deleteComments(
    commentIdsDto: DeleteCommentsRequestDto,
  ): Promise<IMessageAndCountResponse> {
    const { commentIds } = commentIdsDto;

    this.logger.warn(`Comment IDs to delete: ${JSON.stringify(commentIds)}`);

    try {
      // Find existing comments in batches
      const existingComments = await this.findCommentsByIds(commentIds);
      const existingCommentIds = new Set(
        existingComments.map((comment) => comment.id),
      );

      // Calculate not found IDs
      const notFoundIds = commentIds.filter(
        (id) => !existingCommentIds.has(id),
      );

      this.logger.log(
        `Found ${existingComments.length} comments out of ${commentIds.length} requested`,
      );

      let deletedCount = 0;
      const deletedIds: string[] = [];

      // Delete comments in batches for better performance
      if (existingComments.length > 0) {
        const deleteResult = await deleteItemsInArray({
          items: existingComments,
          itemRepository: this.commentsRepo,
          logger: this.logger,
        });
        deletedCount = deleteResult.deletedCount;
        deletedIds.push(...deleteResult.deletedIds);

        // Invalidate caches for deleted comments
        for (const comment of existingComments) {
          await this.cacheService.deleteKey(
            `${REDIS_CACHE_KEYS.COMMENTS.BY_ID}:${comment.id}`,
          );
        }
        await this.cacheService.deleteByPattern(
          `${REDIS_CACHE_KEYS.COMMENTS.LIST}:*`,
        );
      }

      this.logger.log('Comments deleted successfully');

      return {
        message: generateDeleteMessage(
          'comment',
          deletedCount,
          notFoundIds.length,
        ),
        count: deletedCount,
      };
    } catch (error) {
      this.logger.error(
        `[Error] - Delete comments error: ${JSON.stringify(error, null, 2)}`,
      );

      handleErrorException({
        error,
        defaultMessage: MESSAGES.DELETE_COMMENT_FAILED,
      });
    }
  }

  /**
   * Find comments by IDs with optimized query
   * Uses TypeScript generics for type safety
   */
  private async findCommentsByIds(commentIds: string[]): Promise<Comment[]> {
    if (commentIds.length === 0) {
      return [];
    }

    return await this.commentsRepo
      .createQueryBuilder('comment')
      .select(['comment.id', 'comment.content', 'comment.userId'])
      .where('comment.id IN (:...commentIds)', { commentIds })
      .getMany();
  }

  /**
   * Get comments for a specific post
   */
  async getCommentsByPostId(
    postId: string,
    queryUrl: QueryCommentParamDto,
  ): Promise<CommentPaginationResponseDto> {
    this.logger.warn(`Get comments for post ${postId}`);

    // Validate post exists
    await this.postService.getById(postId);

    return this.getCommentsRecently({ ...queryUrl, postId });
  }
}
