// Libs
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

// App sources
import { UserService } from '@app/modules/users/users.service';
import { MESSAGES } from '@app/shared/constants';
import {
  createMockLoggerProvider,
  createRepositoryProvider,
  mockingPostPayload,
  mockingPostUuid,
  mockUuidUser,
} from '@app/shared/mocks';

// Local sources
import { PostService } from './posts.service';
import { Post } from './entities';
import { PostRequestDto } from './dtos';

describe('PostService', () => {
  let service: PostService;
  let postsRepo: jest.Mocked<Repository<Post>>;
  let userService: { getById: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        createRepositoryProvider<Post>(Post, {
          findOne: jest.fn(),
          createQueryBuilder: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
          }),
          save: jest.fn(),
          remove: jest.fn(),
          update: jest.fn(),
          merge: jest.fn(),
          create: jest.fn(),
        }),
        {
          provide: UserService,
          useValue: { getById: jest.fn() },
        },
        createMockLoggerProvider(),
      ],
    }).compile();

    service = module.get<PostService>(PostService);
    postsRepo = module.get(getRepositoryToken(Post));
    userService = module.get(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getById', () => {
    it('throws NotFoundException when post missing', async () => {
      (postsRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.getById('id-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns post when exists', async () => {
      const post = { id: mockingPostUuid } as Post;
      (postsRepo.findOne as jest.Mock).mockResolvedValue(post);
      await expect(service.getById(mockingPostUuid)).resolves.toBe(post);
    });
  });

  describe('create', () => {
    it('validates user and slug uniqueness then saves', async () => {
      userService.getById.mockResolvedValue({ id: mockUuidUser });
      jest.spyOn(service, 'getBySlug').mockResolvedValue(null);
      (postsRepo.save as jest.Mock).mockResolvedValue({
        id: mockingPostUuid,
        title: mockingPostPayload.title,
      });

      const result = await service.create(mockUuidUser, mockingPostPayload);

      expect(userService.getById).toHaveBeenCalledWith(mockUuidUser);
      expect(service.getBySlug).toHaveBeenCalledWith(mockingPostPayload.slug);
      expect(postsRepo.save).toHaveBeenCalledWith({
        ...mockingPostPayload,
        authorId: mockUuidUser,
      });
      expect(result).toEqual({
        id: mockingPostUuid,
        title: mockingPostPayload.title,
      });
    });

    it('throws when slug already exists', async () => {
      userService.getById.mockResolvedValue({ id: mockUuidUser });
      jest
        .spyOn(service, 'getBySlug')
        .mockResolvedValue({ id: mockingPostUuid } as Post);

      await expect(
        service.create(mockUuidUser, mockingPostPayload),
      ).rejects.toThrow(MESSAGES.POST_SLUG_IS_EXISTED);
    });
  });

  describe('updateById', () => {
    it('updates title and contents then saves', async () => {
      const existed = {
        id: mockingPostUuid,
        title: 'old',
        contents: 'old',
      } as Post;
      jest.spyOn(service, 'getById').mockResolvedValue(existed);
      (postsRepo.save as jest.Mock).mockResolvedValue({
        ...existed,
        title: 'new',
        contents: 'new',
      });

      const result = await service.updateById(mockingPostUuid, {
        title: 'new',
        contents: 'new',
      } as PostRequestDto);

      expect(service.getById).toHaveBeenCalledWith(mockingPostUuid);
      expect(postsRepo.save).toHaveBeenCalled();
      expect(result.title).toBe('new');
      expect(result.contents).toBe('new');
    });
  });

  describe('deleteById', () => {
    it('removes existing post', async () => {
      const existed = { id: mockingPostUuid } as Post;
      jest.spyOn(service, 'getById').mockResolvedValue(existed);
      (postsRepo.remove as jest.Mock).mockResolvedValue(undefined);

      const result = await service.deleteById(mockingPostUuid);

      expect(service.getById).toHaveBeenCalledWith(mockingPostUuid);
      expect(postsRepo.remove).toHaveBeenCalledWith(existed);
      expect(result).toEqual({ message: MESSAGES.POST_DELETE_SUCCESS });
    });
  });

  describe('deleteUserPostById', () => {
    it('validates ownership and removes', async () => {
      userService.getById.mockResolvedValue({ id: mockUuidUser });
      (postsRepo.findOne as jest.Mock).mockResolvedValue({
        id: mockingPostUuid,
        authorId: mockUuidUser,
      });
      (postsRepo.remove as jest.Mock).mockResolvedValue(undefined);

      const result = await service.deleteUserPostById(
        mockUuidUser,
        mockingPostUuid,
      );

      expect(userService.getById).toHaveBeenCalledWith(mockUuidUser);
      expect(postsRepo.findOne).toHaveBeenCalled();
      expect(postsRepo.remove).toHaveBeenCalled();
      expect(result).toEqual({
        message: MESSAGES.POST_DELETE_SUCCESS,
        count: 1,
      });
    });
  });
});
