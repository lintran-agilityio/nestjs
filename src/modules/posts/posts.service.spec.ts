// Libs
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

// App sources
import { UserService } from '@app/modules/users/users.service';
import { User } from '@app/modules/users/entities';
import { MESSAGES } from '@app/shared/constants';
import {
  createMockLoggerProvider,
  createRepositoryProvider,
  mockingPostPayload,
  mockingPostUuid,
  mockUuidUser,
} from '@app/shared/mocks';
import * as utils from '@app/shared/utils';

// Local sources
import { PostService } from './posts.service';
import { Post } from './entities';
import { PostRequestDto } from './dtos';

jest.mock('@app/shared/utils', () => ({
  ...jest.requireActual('@app/shared/utils'),
  deleteItemsInArray: jest.fn(),
}));

describe('PostService', () => {
  let service: PostService;
  let postsRepo: {
    findOne: jest.Mock<Promise<Post | null>, [object]>;
    createQueryBuilder: jest.Mock;
    save: jest.Mock<Promise<Post>, [Post | Partial<Post>]>;
    remove: jest.Mock<Promise<Post>, [Post]>;
    update: jest.Mock;
    merge: jest.Mock;
    create: jest.Mock;
  };
  let userService: { getById: jest.Mock<Promise<User>, [string]> };
  let queryBuilder: {
    select: jest.Mock;
    andWhere: jest.Mock;
    where: jest.Mock;
    orderBy: jest.Mock;
    skip: jest.Mock;
    take: jest.Mock;
    getManyAndCount: jest.Mock;
    getMany: jest.Mock;
  };

  beforeEach(async () => {
    queryBuilder = {
      select: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
      getMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        createRepositoryProvider<Post>(Post, {
          findOne: jest.fn(),
          createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
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
      postsRepo.findOne.mockResolvedValue(null);
      await expect(service.getById('id-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns post when exists', async () => {
      const post: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
      } as Partial<Post>);
      postsRepo.findOne.mockResolvedValue(post);
      await expect(service.getById(mockingPostUuid)).resolves.toBe(post);
    });
  });

  describe('create', () => {
    it('validates user and slug uniqueness then saves', async () => {
      const mockUser: User = Object.assign(new User(), {
        id: mockUuidUser,
      } as Partial<User>);
      userService.getById.mockResolvedValue(mockUser);
      jest.spyOn(service, 'getBySlug').mockResolvedValue(null);
      const savedPost: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
        title: mockingPostPayload.title,
        slug: mockingPostPayload.slug,
        contents: mockingPostPayload.contents,
        authorId: mockUuidUser,
      } as Partial<Post>);
      postsRepo.save.mockResolvedValue(savedPost);

      const result = await service.create(mockUuidUser, mockingPostPayload);

      expect(userService.getById).toHaveBeenCalledWith(mockUuidUser);
      expect(postsRepo.save).toHaveBeenCalledWith({
        ...mockingPostPayload,
        authorId: mockUuidUser,
      });
      expect(result).toEqual(savedPost);
    });

    it('throws when slug already exists', async () => {
      const mockUser: User = Object.assign(new User(), {
        id: mockUuidUser,
      } as Partial<User>);
      userService.getById.mockResolvedValue(mockUser);
      const existingPost: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
      } as Partial<Post>);
      jest.spyOn(service, 'getBySlug').mockResolvedValue(existingPost);

      await expect(
        service.create(mockUuidUser, mockingPostPayload),
      ).rejects.toThrow(MESSAGES.POST_SLUG_IS_EXISTED);
    });
  });

  describe('updateById', () => {
    it('updates title and contents then saves', async () => {
      const existed: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
        title: 'old',
        contents: 'old',
        authorId: mockUuidUser,
      } as Partial<Post>);
      jest.spyOn(service, 'getById').mockResolvedValue(existed);
      const updatedPost: Post = Object.assign(new Post(), {
        ...existed,
        title: 'new',
        contents: 'new',
      } as Partial<Post>);
      postsRepo.save.mockResolvedValue(updatedPost);

      const result = await service.updateById(mockingPostUuid, {
        title: 'new',
        contents: 'new',
      } as PostRequestDto);

      expect(postsRepo.save).toHaveBeenCalled();
      expect(result.title).toBe('new');
      expect(result.contents).toBe('new');
    });
  });

  describe('deleteById', () => {
    it('removes existing post', async () => {
      const existed: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
      } as Partial<Post>);
      jest.spyOn(service, 'getById').mockResolvedValue(existed);
      postsRepo.remove.mockResolvedValue(existed);

      const result = await service.deleteById(mockingPostUuid);

      expect(postsRepo.remove).toHaveBeenCalledWith(existed);
      expect(result).toEqual({ message: MESSAGES.POST_DELETE_SUCCESS });
    });
  });

  describe('deleteUserPostById', () => {
    it('validates ownership and removes', async () => {
      const mockUser: User = Object.assign(new User(), {
        id: mockUuidUser,
      } as Partial<User>);
      userService.getById.mockResolvedValue(mockUser);
      const post: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
        authorId: mockUuidUser,
      } as Partial<Post>);
      postsRepo.findOne.mockResolvedValue(post);
      postsRepo.remove.mockResolvedValue(post);

      const result = await service.deleteUserPostById(
        mockUuidUser,
        mockingPostUuid,
      );

      expect(userService.getById).toHaveBeenCalledWith(mockUuidUser);
      expect(postsRepo.findOne).toHaveBeenCalled();
      expect(postsRepo.remove).toHaveBeenCalledWith(post);
      expect(result).toEqual({
        message: MESSAGES.POST_DELETE_SUCCESS,
        count: 1,
      });
    });

    it('throws NotFoundException when post not found for user', async () => {
      const mockUser: User = Object.assign(new User(), {
        id: mockUuidUser,
      } as Partial<User>);
      userService.getById.mockResolvedValue(mockUser);
      postsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.deleteUserPostById(mockUuidUser, mockingPostUuid),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('handles errors when delete fails', async () => {
      const mockUser: User = Object.assign(new User(), {
        id: mockUuidUser,
      } as Partial<User>);
      userService.getById.mockResolvedValue(mockUser);
      const post: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
        authorId: mockUuidUser,
      } as Partial<Post>);
      postsRepo.findOne.mockResolvedValue(post);
      postsRepo.remove.mockRejectedValue(new Error('delete-fail'));

      await expect(
        service.deleteUserPostById(mockUuidUser, mockingPostUuid),
      ).rejects.toThrow();
    });
  });

  describe('getAll', () => {
    it('returns paginated posts without search', async () => {
      const mockPost: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
        title: 'Test Post',
      } as Partial<Post>);
      queryBuilder.getManyAndCount.mockResolvedValue([[mockPost], 1]);

      const result = await service.getAll({});

      expect(queryBuilder.select).toHaveBeenCalled();
      expect(result.data).toEqual([mockPost]);
      expect(result.meta.total).toBe(1);
    });

    it('filters by search when provided', async () => {
      const mockPost: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
        title: 'Test Post',
      } as Partial<Post>);
      queryBuilder.getManyAndCount.mockResolvedValue([[mockPost], 1]);

      await service.getAll({ search: 'test' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(post.title ILIKE :search OR post.contents ILIKE :search)',
        { search: '%test%' },
      );
    });

    it('handles errors when query fails', async () => {
      queryBuilder.getManyAndCount.mockRejectedValue(new Error('query-fail'));

      await expect(service.getAll({})).rejects.toThrow();
    });
  });

  describe('getBySlug', () => {
    it('returns post when found by slug', async () => {
      const post: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
        slug: 'test-slug',
      } as Partial<Post>);
      postsRepo.findOne.mockResolvedValue(post);

      const result = await service.getBySlug('test-slug');

      expect(postsRepo.findOne).toHaveBeenCalledWith({
        where: { slug: 'test-slug' },
      });
      expect(result).toBe(post);
    });

    it('returns null when post not found by slug', async () => {
      postsRepo.findOne.mockResolvedValue(null);

      const result = await service.getBySlug('non-existent-slug');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('handles error when save fails', async () => {
      const mockUser: User = Object.assign(new User(), {
        id: mockUuidUser,
      } as Partial<User>);
      userService.getById.mockResolvedValue(mockUser);
      jest.spyOn(service, 'getBySlug').mockResolvedValue(null);
      postsRepo.save.mockRejectedValue(new Error('save-fail'));

      await expect(
        service.create(mockUuidUser, mockingPostPayload),
      ).rejects.toThrow();
    });
  });

  describe('updateById', () => {
    it('handles error when save fails', async () => {
      const existed: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
        title: 'old',
        contents: 'old',
        authorId: mockUuidUser,
      } as Partial<Post>);
      jest.spyOn(service, 'getById').mockResolvedValue(existed);
      postsRepo.save.mockRejectedValue(new Error('save-fail'));

      await expect(
        service.updateById(mockingPostUuid, {
          title: 'new',
          contents: 'new',
        } as PostRequestDto),
      ).rejects.toThrow();
    });
  });

  describe('deleteById', () => {
    it('handles error when remove fails', async () => {
      const existed: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
      } as Partial<Post>);
      jest.spyOn(service, 'getById').mockResolvedValue(existed);
      postsRepo.remove.mockRejectedValue(new Error('remove-fail'));

      await expect(service.deleteById(mockingPostUuid)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('deletes posts by ids successfully', async () => {
      const post1 = Object.assign(new Post(), {
        id: mockingPostUuid,
        authorId: mockUuidUser,
      } as Partial<Post>);
      const post2 = Object.assign(new Post(), {
        id: '22222222-2222-2222-2222-222222222222',
        authorId: mockUuidUser,
      } as Partial<Post>);

      queryBuilder.getMany.mockResolvedValue([post1, post2]);
      queryBuilder.select.mockReturnThis();
      queryBuilder.where.mockReturnThis();

      (utils.deleteItemsInArray as jest.Mock).mockResolvedValue({
        deletedCount: 2,
        deletedIds: [mockingPostUuid, '22222222-2222-2222-2222-222222222222'],
      });

      const result = await service.delete({
        postIds: [mockingPostUuid, '22222222-2222-2222-2222-222222222222'],
      });

      expect(result.count).toBe(2);
      expect(result.message).toBeDefined();
    });

    it('handles posts not found', async () => {
      queryBuilder.getMany.mockResolvedValue([]);
      queryBuilder.select.mockReturnThis();
      queryBuilder.where.mockReturnThis();

      (utils.deleteItemsInArray as jest.Mock).mockResolvedValue({
        deletedCount: 0,
        deletedIds: [],
      });

      const result = await service.delete({
        postIds: ['non-existent-id'],
      });

      expect(result.count).toBe(0);
      expect(result.message).toContain('post');
    });

    it('handles errors when delete fails', async () => {
      queryBuilder.getMany.mockRejectedValue(new Error('find-fail'));
      queryBuilder.select.mockReturnThis();
      queryBuilder.where.mockReturnThis();

      await expect(
        service.delete({ postIds: [mockingPostUuid] }),
      ).rejects.toThrow();
    });
  });
});
