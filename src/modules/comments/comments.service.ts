// libs
import {
  Injectable,
  InternalServerErrorException,
  LoggerService,
  NotFoundException,
  Inject,
  forwardRef,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MESSAGES } from '@app/shared/constants';
import {
  getSelectFields,
  deleteItemsInArray,
  generateDeleteMessage,
} from '@app/shared/utils';
import { IMessageAndCountResponse, OrderBy } from '@app/shared/types';
import { Comment } from './entities';
import { COMMENT_SELECT_FIELDS } from './config';
import { AppLoggerService } from '../logger/logger.service';
import { UserService } from '../user/users.service';
import { PostService } from '../posts/posts.service';
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
  ) {
    // Create context name for logger
    this.logger = this.appLoggerServices.getLoggerName(CommentService.name);
  }

  /**
   * Get all comments with pagination and filtering
   * Supports filtering by postId
   */
  async getComments(
    queryUrl: QueryCommentParamDto,
  ): Promise<CommentPaginationResponseDto> {
    this.logger.log('Get all comments...');

    try {
      this.logger.warn(`Query get all comments: ${JSON.stringify(queryUrl)}`);
      const { limit, orderBy, page, sortBy, search, postId } = queryUrl;

      const query = {
        limit: limit || 10,
        orderBy: orderBy?.toUpperCase() === 'DESC' ? OrderBy.DESC : OrderBy.ASC,
        page: page || 1,
        sortBy: sortBy || 'createdAt',
        search,
        postId,
      };

      const numberPage = Number(page) || 1;
      const numberLimit = Number(limit) || 10;
      const skip = (numberPage - 1) * numberLimit;

      this.logger.warn(`Query get all comments: ${JSON.stringify(query)}`);

      // Get select fields from config
      const selectFields = getSelectFields(COMMENT_SELECT_FIELDS);
      const allowedSortFields = selectFields;
      const sortField = allowedSortFields.includes(sortBy ?? '')
        ? sortBy
        : 'createdAt';

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
      if (search) {
        queryBuilder = queryBuilder.andWhere('comment.content ILIKE :search', {
          search: `%${search}%`,
        });
      }

      // Apply sorting and pagination
      queryBuilder = queryBuilder
        .orderBy(`comment.${sortField}`, orderBy)
        .skip(skip)
        .take(numberLimit);

      const [data, total] = await queryBuilder.getManyAndCount();

      this.logger.log(`Get all comments successful: ${JSON.stringify(data)}`);

      return {
        data,
        meta: {
          total,
          page: numberPage,
          limit: numberLimit,
          totalPages: Math.ceil(total / numberLimit),
        },
      };
    } catch (error) {
      this.logger.error(
        `[Error] - Get error when get all comments: ${JSON.stringify(error)}`,
      );

      throw new InternalServerErrorException('Server error');
    }
  }

  /**
   * Get comment by ID
   * Includes user and post relationships
   */
  async getCommentById(id: string): Promise<Comment> {
    this.logger.warn(`Get comment by Id - ${id}...`);

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
      // relations: ['user', 'post'],
      relations: {
        user: true,
        post: true,
      },
    });

    if (!comment) {
      this.logger.log(`Comment not found by: ${id}`);
      throw new NotFoundException(MESSAGES.COMMENT_NOT_FOUND);
    }

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

      return savedComment;
    } catch (error) {
      this.logger.error(
        `[Error] - Error creating comment: ${JSON.stringify(error)}`,
      );

      throw new InternalServerErrorException('Server error');
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
      throw new UnauthorizedException(MESSAGES.COMMENT_NO_AUTHORIZED);
    }

    try {
      comment.content = updateDto.content;
      const updatedComment = await this.commentsRepo.save(comment);

      this.logger.log(`Comment ${id} updated successfully`);

      return updatedComment;
    } catch (error) {
      this.logger.error(
        `[Error] - Error updating comment: ${JSON.stringify(error)}`,
      );

      throw new InternalServerErrorException('Server error');
    }
  }

  /**
   * Delete comment by ID
   * Validates comment ownership
   */
  async deleteCommentById(
    id: string,
    userId: string,
  ): Promise<IMessageAndCountResponse> {
    this.logger.warn(`User ${userId} will delete comment id - ${id}`);

    const comment = await this.getCommentById(id);

    // Check if user owns the comment
    if (comment.userId !== userId) {
      this.logger.warn(
        `User ${userId} attempted to delete comment ${id} owned by ${comment.userId}`,
      );
      throw new UnauthorizedException(MESSAGES.COMMENT_NO_AUTHORIZED);
    }

    try {
      await this.commentsRepo.remove(comment);

      this.logger.log(`Comment ${id} deleted successfully`);

      return { message: MESSAGES.COMMENT_DELETE_SUCCESS };
    } catch (error) {
      this.logger.error(
        `[Error] - Error deleting comment: ${JSON.stringify(error)}`,
      );
      throw new InternalServerErrorException('Server error');
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
      throw new InternalServerErrorException('Server error');
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

    return this.getComments({ ...queryUrl, postId });
  }
}
