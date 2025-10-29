// libs
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { RolesGuard, JwtAuthGuard } from '@app/shared/guards';
import {
  ApiCreatedResponseDto,
  ApiOkResponseDto,
  Roles,
} from '@app/shared/decorators';
import {
  IMessageAndCountResponse,
  IUserInfo,
  UserRole,
} from '@app/shared/types';
import { Comment } from './entities';
import {
  CreateCommentRequestDto,
  CommentPaginationResponseDto,
  UpdateCommentRequestDto,
  DeleteCommentsRequestDto,
  QueryCommentParamDto,
} from './dtos';
import { CommentService } from './comments.service';
import { GetCurrentUser } from '@app/shared/decorators';
import { PATHS } from '@app/shared/constants';

const { USER, ADMIN } = UserRole;

/**
 * Comment Controller
 * Handles all HTTP requests related to comments
 * Implements authentication, authorization, and proper response types
 */
@Controller(PATHS.COMMENTS)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  /**
   * Get all comments with pagination
   * Supports filtering by postId
   */
  @Get()
  @Roles(ADMIN, USER)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Get all comments',
    description: 'Get all comments with pagination and filtering',
    type: CommentPaginationResponseDto,
  })
  async getComments(
    @Query() paramQueryDto: QueryCommentParamDto,
  ): Promise<CommentPaginationResponseDto> {
    return await this.commentService.getComments(paramQueryDto);
  }

  /**
   * Get comments for a specific post
   */
  @Get('post/:postId')
  @Roles(ADMIN, USER)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Get comments by post ID',
    description: 'Get all comments for a specific post',
    type: CommentPaginationResponseDto,
  })
  async getCommentsByPostId(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query() paramQueryDto: QueryCommentParamDto,
  ): Promise<CommentPaginationResponseDto> {
    return await this.commentService.getCommentsByPostId(postId, paramQueryDto);
  }

  /**
   * Get comment by ID
   */
  @Get(':id')
  @Roles(ADMIN, USER)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Get comment by ID',
    description: 'Get a specific comment by its ID',
    type: Comment,
  })
  async getCommentById(@Param('id', ParseUUIDPipe) id: string): Promise<any> {
    return await this.commentService.getCommentById(id);
  }

  /**
   * Create a new comment on a post
   */
  @Post()
  @Roles(ADMIN, USER)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponseDto({
    summary: 'Create a comment',
    description: 'Create a new comment on a post',
    type: Comment,
  })
  async createComment(
    @GetCurrentUser() user: IUserInfo,
    @Body() commentDto: CreateCommentRequestDto,
  ): Promise<any> {
    return await this.commentService.createComment(user.id, commentDto);
  }

  /**
   * Update comment by ID
   * Only the comment owner can update
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Update comment',
    description: 'Update a comment by ID (only owner)',
    type: Comment,
  })
  async updateCommentById(
    @Param('id', ParseUUIDPipe) id: string,
    @GetCurrentUser() user: IUserInfo,
    @Body() updateCommentDto: UpdateCommentRequestDto,
  ): Promise<any> {
    return await this.commentService.updateCommentById(
      id,
      user.id,
      updateCommentDto,
    );
  }

  /**
   * Delete comment by ID
   * Only the comment owner can delete
   */
  @Delete(':id')
  @Roles(ADMIN, USER)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Delete comment by ID',
    description: 'Delete a comment by ID (only owner)',
    type: String,
  })
  async deleteCommentById(
    @Param('id', ParseUUIDPipe) id: string,
    @GetCurrentUser() user: IUserInfo,
  ): Promise<IMessageAndCountResponse> {
    return await this.commentService.deleteCommentById(id, user.id);
  }

  /**
   * Delete comments
   * Admin only operation
   */
  @Delete()
  @Roles(ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Delete comments',
    description: 'Delete multiple comments at once (Admin only)',
    type: String,
  })
  async deleteComments(
    @Body() commentIdsDto: DeleteCommentsRequestDto,
  ): Promise<IMessageAndCountResponse> {
    return await this.commentService.deleteComments(commentIdsDto);
  }
}
