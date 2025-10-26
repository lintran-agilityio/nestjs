// libs
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';

import {
  RolesGuard,
  JwtAuthGuard,
  UserOwnershipProtected,
} from '@app/shared/guard';
import {
  ApiCreatedResponseDto,
  ApiOkResponseDto,
  Roles,
} from '@app/shared/decorator';
import { QueryPaginationParamDto } from '@app/shared/dto';
import {
  IMessageAndCountResponse,
  IUserInfo,
  UserRole,
} from '@app/shared/types';
import { Post as PostEntities } from './entities';
import {
  CreateUserPostRequestDto,
  PostPaginationResponseDto,
  UpdateUserPostRequestDto,
  DeletePostsRequestDto,
} from './dto';
import { PostService } from './post.service';
import { GetCurrentUser } from '@app/shared/decorators';

const { USER, ADMIN } = UserRole;

@Controller('posts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  @Roles(ADMIN, USER)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Get all post for ADMIN user role',
    description: 'Get all posts successful',
    type: PostPaginationResponseDto,
  })
  async getPosts(
    @Query() paramQueryDto: QueryPaginationParamDto,
  ): Promise<PostPaginationResponseDto> {
    return await this.postService.getPosts(paramQueryDto);
  }

  @Get(':id')
  @Roles(ADMIN, USER)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Get post by id for ADMIN user role',
    description: 'Get post by id successful',
    type: PostEntities,
  })
  async getPostsById(@Param('id') id: string): Promise<PostEntities> {
    return await this.postService.getPostsById(id);
  }

  @Post('create-post')
  @UserOwnershipProtected('authorId', [USER])
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponseDto({
    summary: 'Create post of user',
    description: 'Create Post of User successfully',
    type: PostEntities,
  })
  async postUsersPost(
    @GetCurrentUser() user: IUserInfo,
    @Body() postDto: CreateUserPostRequestDto,
  ): Promise<PostEntities> {
    return await this.postService.postUsersPost(user.id, postDto);
  }

  @Patch(':id')
  @UserOwnershipProtected('id', [ADMIN, USER])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Update post of user by id post',
    description: 'Update post of user successfully',
    type: PostEntities,
  })
  async updateUsersPostById(
    @Param('id') id: string,
    @Body() updatePostDto: UpdateUserPostRequestDto,
  ): Promise<PostEntities> {
    return await this.postService.putUsersPostById(id, updatePostDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'User delete Post by ID',
    description: 'Deleted post successfully',
    type: String,
  })
  async deleteUsersById(
    @Param('id') id: string,
  ): Promise<IMessageAndCountResponse> {
    return await this.postService.deleteUsersPostById(id);
  }

  @Delete()
  @Roles(ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Delete posts',
    description: 'Delete multiple posts at once with comprehensive results',
    type: String,
  })
  async deleteUserPosts(
    @Body() postIdsDto: DeletePostsRequestDto,
  ): Promise<IMessageAndCountResponse> {
    return await this.postService.deletePosts(postIdsDto);
  }
}
