// Libs
import { Test, TestingModule } from '@nestjs/testing';

// App sources
import { IUserInfo, IMessageAndCountResponse } from '@app/shared/types';
import { mockingUserResponse, mockUuidUser } from '@app/shared/mocks';

// Local sources
import { PostController } from './posts.controller';
import { PostService } from './posts.service';
import {
  PostPaginationResponseDto,
  PostRequestDto,
  DeletePostsRequestDto,
} from './dtos';
import { Post as PostEntities } from './entities';

describe('PostController', () => {
  let controller: PostController;
  let postService: {
    getPostsRecently: jest.Mock;
    getById: jest.Mock;
    create: jest.Mock;
    updateById: jest.Mock;
    deleteById: jest.Mock;
    delete: jest.Mock;
  };

  const mockUser: IUserInfo = {
    id: mockUuidUser,
    email: mockingUserResponse.email,
    role: mockingUserResponse.role,
    status: mockingUserResponse.status,
    firstName: mockingUserResponse.firstName,
    lastName: mockingUserResponse.lastName,
  };

  beforeEach(async () => {
    postService = {
      getPostsRecently: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [{ provide: PostService, useValue: postService }],
    }).compile();

    controller = module.get<PostController>(PostController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getPostsRecently should delegate to service', async () => {
    const mockResponse: PostPaginationResponseDto = {
      data: [],
      meta: {
        total: 0,
        totalPages: 0,
        limit: 10,
        page: 1,
      },
    };
    postService.getPostsRecently.mockResolvedValue(mockResponse);
    const result = await controller.getPostsRecently({});
    expect(postService.getPostsRecently).toHaveBeenCalledWith({});
    expect(result).toEqual(mockResponse);
  });

  it('get should delegate to service', async () => {
    const mockPost: PostEntities = { id: 'p1' } as PostEntities;
    postService.getById.mockResolvedValue(mockPost);
    const result = await controller.get('p1');
    expect(postService.getById).toHaveBeenCalledWith('p1');
    expect(result).toEqual(mockPost);
  });

  it('create should delegate to service', async () => {
    const postDto: PostRequestDto = { title: 't', contents: 'c', slug: 's' };
    const mockPost: PostEntities = { id: 'p1' } as PostEntities;
    postService.create.mockResolvedValue(mockPost);
    const result = await controller.create(mockUser, postDto);
    expect(postService.create).toHaveBeenCalledWith(mockUser.id, postDto);
    expect(result).toEqual(mockPost);
  });

  it('updateById should delegate to service', async () => {
    const updatePostDto: PostRequestDto = {
      title: 'new',
      contents: 'c',
      slug: 's',
    };
    const mockPost: PostEntities = { id: 'p1', title: 'new' } as PostEntities;
    postService.updateById.mockResolvedValue(mockPost);
    const result = await controller.updateById('p1', mockUser, updatePostDto);
    expect(postService.updateById).toHaveBeenCalledWith(
      mockUser,
      'p1',
      updatePostDto,
    );
    expect(result).toEqual(mockPost);
  });

  it('deleteById should delegate to service', async () => {
    const mockResponse: IMessageAndCountResponse = { message: 'ok' };
    postService.deleteById.mockResolvedValue(mockResponse);
    const result = await controller.deleteById('p1', mockUser);
    expect(postService.deleteById).toHaveBeenCalledWith('p1', mockUser);
    expect(result).toEqual(mockResponse);
  });

  it('deleteUserPosts should delegate to service', async () => {
    const postIdsDto: DeletePostsRequestDto = { postIds: ['p1'] };
    const mockResponse: IMessageAndCountResponse = {
      message: 'ok',
      count: 1,
    };
    postService.delete.mockResolvedValue(mockResponse);
    const result = await controller.deleteUserPosts(postIdsDto);
    expect(postService.delete).toHaveBeenCalledWith(postIdsDto);
    expect(result).toEqual(mockResponse);
  });
});
