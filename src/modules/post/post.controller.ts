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
} from '@nestjs/common';

import { PostService } from './post.service';
import { ApiCreatedResponseDto, ApiOkResponseDto } from '@app/shared/decorator';
import {
  CreateUserPostRequestDto,
  PostPaginationResponseDto,
  UpdateUserPostRequestDto,
} from './dto';
import { QueryPaginationParamDto } from '@app/shared/dto';
import { Post as PostEntities } from './entities';
import { IMessageAndCountRepose } from '@app/shared/types';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
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
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponseDto({
    summary: 'Create post of user',
    description: 'Create Post of User successfully',
    type: PostEntities,
  })
  async postUsersPost(
    @Body() postDto: CreateUserPostRequestDto,
  ): Promise<PostEntities> {
    return await this.postService.postUsersPost(postDto);
  }

  @Patch(':id')
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
  ): Promise<IMessageAndCountRepose> {
    return await this.postService.deleteUsersPostById(id);
  }
}
