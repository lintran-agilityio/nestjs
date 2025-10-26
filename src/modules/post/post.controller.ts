// Libs
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiNoContentResponse } from '@nestjs/swagger';

// App sources
import {
  ApiCreatedResponseDto,
  ApiOkResponseDto,
  GetCurrentUser,
  Roles,
} from '@app/shared/decorators';
import { QueryPaginationParamDto } from '@app/shared/dto';
import {
  JwtAuthGuard,
  RolesGuard,
  UserOwnershipProtected,
} from '@app/shared/guard';
import {
  IMessageAndCountResponse,
  IUserInfo,
  UserRole,
} from '@app/shared/types';

// Local sources
import {
  CreateUserPostRequestDto,
  DeletePostsRequestDto,
  PostPaginationResponseDto,
  UpdateUserPostRequestDto,
} from './dto';
import { Post as PostEntities } from './entities';
import { PostService } from './post.service';

const { USER, ADMIN } = UserRole;

@Controller('posts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  /**
   * Get all posts with pagination
   * @param paramQueryDto - Query parameters for pagination, sorting, and filtering
   * @returns Paginated list of posts
   * @throws InternalServerErrorException on server error
   */
  @Get()
  @Roles(ADMIN, USER)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Get all posts',
    description:
      'Retrieve paginated list of posts with optional search and filtering',
    type: PostPaginationResponseDto,
  })
  async getPosts(
    @Query() paramQueryDto: QueryPaginationParamDto,
  ): Promise<PostPaginationResponseDto> {
    return await this.postService.getAll(paramQueryDto);
  }

  /**
   * Get a post by ID
   * @param id - The post ID
   * @returns Post details
   * @throws NotFoundException if post not found
   * @throws InternalServerErrorException on server error
   */
  @Get(':id')
  @Roles(ADMIN, USER)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Get post by ID',
    description: 'Retrieve a specific post by its unique identifier',
    type: PostEntities,
  })
  async getById(@Param('id') id: string): Promise<PostEntities> {
    return await this.postService.getById(id);
  }

  /**
   * Create a new post
   * @param user - Current authenticated user from JWT token
   * @param postDto - Post creation data
   * @returns Created post information
   * @throws NotFoundException if user not found
   * @throws InternalServerErrorException on server error
   */
  @Post()
  @UserOwnershipProtected('authorId', [USER])
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponseDto({
    summary: 'Create a new post',
    description: 'Create a new post for the authenticated user',
    type: PostEntities,
  })
  async createUsersPost(
    @GetCurrentUser() user: IUserInfo,
    @Body() postDto: CreateUserPostRequestDto,
  ): Promise<PostEntities> {
    return await this.postService.create(user.id, postDto);
  }

  /**
   * Update an existing post by ID
   * @param id - The post ID to update
   * @param updatePostDto - Updated post data
   * @returns Updated post information
   * @throws NotFoundException if post not found
   * @throws InternalServerErrorException on server error
   */
  @Patch(':id')
  @UserOwnershipProtected('id', [ADMIN, USER])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Update a post',
    description: 'Update an existing post by its unique identifier',
    type: PostEntities,
  })
  async updateUsersPostById(
    @Param('id') id: string,
    @Body() updatePostDto: UpdateUserPostRequestDto,
  ): Promise<PostEntities> {
    return await this.postService.updateById(id, updatePostDto);
  }

  /**
   * Delete a post by ID
   * @param id - The post ID to delete
   * @returns Success message and deletion count
   * @throws NotFoundException if post not found
   * @throws InternalServerErrorException on server error
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: 'Delete a post by its unique identifier',
    type: String,
  })
  async deleteUsersById(
    @Param('id') id: string,
  ): Promise<IMessageAndCountResponse> {
    return await this.postService.deleteById(id);
  }

  /**
   * Bulk delete multiple posts by IDs
   * @param postIdsDto - Object containing array of post IDs to delete
   * @returns Success message with deletion count
   * @throws InternalServerErrorException on server error
   */
  @Delete()
  @Roles(ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: 'Delete multiple posts at once with comprehensive results',
    type: String,
  })
  async deleteUserPosts(
    @Body() postIdsDto: DeletePostsRequestDto,
  ): Promise<IMessageAndCountResponse> {
    return await this.postService.detele(postIdsDto);
  }
}
