// libs
import {
  Injectable,
  InternalServerErrorException,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Post } from './entities';
import { AppLoggerService } from '../logger/logger.service';
import { QueryPaginationParamDto } from '@app/shared/dto';
import {
  CreateUserPostRequestDto,
  PostPaginationResponseDto,
  UpdateUserPostRequestDto,
} from './dto';
import { POST_SELECT_FIELDS } from './config';
import { getSelectFields } from '@app/shared/utils';
import { IMessageAndCountRepose, OrderBy } from '@app/shared/types';
import { MESSAGES } from '@app/shared/constants';
import { UserService } from '../user/user.service';

@Injectable()
export class PostService {
  private readonly logger: LoggerService;

  constructor(
    private readonly appLoggerServices: AppLoggerService,

    @InjectRepository(Post)
    private readonly postsRepo: Repository<Post>,

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

  async postUsersPost(postDto: CreateUserPostRequestDto): Promise<Post> {
    const { authorId } = postDto;

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

  async deleteUsersPostById(id: string): Promise<IMessageAndCountRepose> {
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
}
