// Libs
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Brackets } from 'typeorm';

// Apis
import { UserService } from '@app/apis/users/users.service';
import { User } from '@app/apis/users/entities';

// App sources
import { MESSAGES, REDIS_CACHE_KEYS, TTL_CACHE } from '@app/shared/constants';
import {
  createMockLoggerProvider,
  createRepositoryProvider,
  mockingPostPayload,
  mockingPostUuid,
  mockUuidUser,
  mockingUserInfo,
  mockingMetadata,
} from '@app/shared/mocks';
import { CacheAbstractService } from '@app/shared/modules/cache/cache.abstract.service';
import { IUserInfo, UserRole, UserStatus } from '@app/shared/types';
import * as utils from '@app/shared/utils';

// Local sources
import { PostService } from './posts.service';
import { Post } from './entities';
import { PostRequestDto } from './dtos';

jest.mock('@app/shared/utils', () => ({
  ...jest.requireActual('@app/shared/utils'),
  deleteItemsInArray: jest.fn(),
  getDataPagination: jest.fn(),
  getSelectFields: jest.fn(),
  validateOwnerRole: jest.fn(),
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
  let cacheService: {
    getKey: jest.Mock;
    setKey: jest.Mock;
    deleteKey: jest.Mock;
    deleteByPattern: jest.Mock;
  };
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

  const mockUser: IUserInfo = {
    id: mockUuidUser,
    email: mockingUserInfo.email,
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    firstName: 'Lin',
    lastName: 'Tran',
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

    cacheService = {
      getKey: jest.fn().mockResolvedValue(null),
      setKey: jest.fn().mockResolvedValue(undefined),
      deleteKey: jest.fn().mockResolvedValue(undefined),
      deleteByPattern: jest.fn().mockResolvedValue(undefined),
    };

    // Reset all mocks
    (utils.getSelectFields as jest.Mock) = jest
      .fn()
      .mockReturnValue(['id', 'title', 'contents', 'slug']);
    (utils.validateOwnerRole as jest.Mock) = jest.fn();

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
        {
          provide: CacheAbstractService,
          useValue: cacheService,
        },
        createMockLoggerProvider(),
      ],
    }).compile();

    service = module.get<PostService>(PostService);
    postsRepo = module.get(getRepositoryToken(Post));
    userService = module.get(UserService);
    cacheService = module.get(CacheAbstractService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getById', () => {
    it('throws NotFoundException when post missing', async () => {
      cacheService.getKey.mockResolvedValue(null);
      postsRepo.findOne.mockResolvedValue(null);
      await expect(service.getById('id-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(cacheService.getKey).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.POSTS.BY_ID}:id-1`,
      );
    });

    it('returns cached post when available', async () => {
      const cachedPost: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
      } as Partial<Post>);
      cacheService.getKey.mockResolvedValue(cachedPost);

      const result = await service.getById(mockingPostUuid);

      expect(result).toBe(cachedPost);
      expect(postsRepo.findOne).not.toHaveBeenCalled();
    });

    it('returns post from database and caches it', async () => {
      cacheService.getKey.mockResolvedValue(null);
      const post: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
      } as Partial<Post>);
      postsRepo.findOne.mockResolvedValue(post);

      const result = await service.getById(mockingPostUuid);

      expect(result).toBe(post);
      expect(cacheService.setKey).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.POSTS.BY_ID}:${mockingPostUuid}`,
        post,
        TTL_CACHE.POST_BY_ID,
      );
    });
  });

  describe('getBySlug', () => {
    it('returns cached post when available', async () => {
      const cachedPost: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
        slug: 'test-slug',
      } as Partial<Post>);
      cacheService.getKey.mockResolvedValue(cachedPost);

      const result = await service.getBySlug('test-slug');

      expect(result).toBe(cachedPost);
      expect(postsRepo.findOne).not.toHaveBeenCalled();
    });

    it('returns post when found by slug and caches it', async () => {
      cacheService.getKey.mockResolvedValue(null);
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
      expect(cacheService.setKey).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.POSTS.BY_SLUG}:test-slug`,
        post,
        TTL_CACHE.POST_BY_SLUG,
      );
    });

    it('returns null when post not found by slug', async () => {
      cacheService.getKey.mockResolvedValue(null);
      postsRepo.findOne.mockResolvedValue(null);

      const result = await service.getBySlug('non-existent-slug');

      expect(result).toBeNull();
      expect(cacheService.setKey).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('validates user and slug uniqueness then saves', async () => {
      const mockUserEntity: User = Object.assign(new User(), {
        id: mockUuidUser,
      } as Partial<User>);
      userService.getById.mockResolvedValue(mockUserEntity);
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
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.POSTS.LIST}:*`,
      );
      expect(cacheService.setKey).toHaveBeenCalledTimes(2);
    });

    it('throws when slug already exists', async () => {
      const mockUserEntity: User = Object.assign(new User(), {
        id: mockUuidUser,
      } as Partial<User>);
      userService.getById.mockResolvedValue(mockUserEntity);
      const existingPost: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
      } as Partial<Post>);
      jest.spyOn(service, 'getBySlug').mockResolvedValue(existingPost);

      await expect(
        service.create(mockUuidUser, mockingPostPayload),
      ).rejects.toThrow(MESSAGES.POST_SLUG_IS_EXISTED);
    });

    it('handles error when save fails', async () => {
      const mockUserEntity: User = Object.assign(new User(), {
        id: mockUuidUser,
      } as Partial<User>);
      userService.getById.mockResolvedValue(mockUserEntity);
      jest.spyOn(service, 'getBySlug').mockResolvedValue(null);
      postsRepo.save.mockRejectedValue(new Error('save-fail'));

      await expect(
        service.create(mockUuidUser, mockingPostPayload),
      ).rejects.toThrow();
    });
  });

  describe('updateById', () => {
    it('updates title and contents then saves', async () => {
      const existed: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
        title: 'old',
        contents: 'old',
        slug: 'old-slug',
        authorId: mockUuidUser,
      } as Partial<Post>);
      jest.spyOn(service, 'getById').mockResolvedValue(existed);
      const updatedPost: Post = Object.assign(new Post(), {
        ...existed,
        title: 'new',
        contents: 'new',
      } as Partial<Post>);
      postsRepo.save.mockResolvedValue(updatedPost);

      const updateDto: PostRequestDto = {
        title: 'new',
        contents: 'new',
        slug: 'old-slug',
      };

      const result = await service.updateById(
        mockUser,
        mockingPostUuid,
        updateDto,
      );

      expect(utils.validateOwnerRole).toHaveBeenCalledWith(
        mockUser,
        existed,
        'authorId',
      );
      expect(postsRepo.save).toHaveBeenCalled();
      expect(result.title).toBe('new');
      expect(result.contents).toBe('new');
      expect(cacheService.deleteKey).toHaveBeenCalledTimes(3);
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.POSTS.LIST}:*`,
      );
      expect(cacheService.setKey).toHaveBeenCalledTimes(2);
    });

    it('throws BadRequestException when updateDto is invalid', async () => {
      const existed: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
        title: 'old',
        contents: 'old',
        authorId: mockUuidUser,
      } as Partial<Post>);
      jest.spyOn(service, 'getById').mockResolvedValue(existed);

      await expect(
        service.updateById(mockUser, mockingPostUuid, {} as PostRequestDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('handles error when save fails', async () => {
      const existed: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
        title: 'old',
        contents: 'old',
        slug: 'old-slug',
        authorId: mockUuidUser,
      } as Partial<Post>);
      jest.spyOn(service, 'getById').mockResolvedValue(existed);
      postsRepo.save.mockRejectedValue(new Error('save-fail'));

      await expect(
        service.updateById(mockUser, mockingPostUuid, {
          title: 'new',
          contents: 'new',
          slug: 'old-slug',
        } as PostRequestDto),
      ).rejects.toThrow();
    });
  });

  describe('deleteById', () => {
    it('removes existing post', async () => {
      const existed: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
        slug: 'test-slug',
      } as Partial<Post>);
      jest.spyOn(service, 'getById').mockResolvedValue(existed);
      postsRepo.remove.mockResolvedValue(existed);

      const result = await service.deleteById(mockingPostUuid, mockUser);

      expect(utils.validateOwnerRole).toHaveBeenCalledWith(
        mockUser,
        existed,
        'authorId',
      );
      expect(postsRepo.remove).toHaveBeenCalledWith(existed);
      expect(result).toEqual({ message: MESSAGES.POST_DELETE_SUCCESS });
      expect(cacheService.deleteKey).toHaveBeenCalledTimes(2);
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.POSTS.LIST}:*`,
      );
    });

    it('handles error when remove fails', async () => {
      const existed: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
      } as Partial<Post>);
      jest.spyOn(service, 'getById').mockResolvedValue(existed);
      postsRepo.remove.mockRejectedValue(new Error('remove-fail'));

      await expect(
        service.deleteById(mockingPostUuid, mockUser),
      ).rejects.toThrow();
    });
  });

  describe('deletePostById', () => {
    it('validates ownership and removes', async () => {
      const mockUserEntity: User = Object.assign(new User(), {
        id: mockUuidUser,
      } as Partial<User>);
      userService.getById.mockResolvedValue(mockUserEntity);
      const post: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
        authorId: mockUuidUser,
      } as Partial<Post>);
      postsRepo.findOne.mockResolvedValue(post);
      postsRepo.remove.mockResolvedValue(post);

      await service.deletePostById(mockUuidUser, mockingPostUuid);

      expect(userService.getById).toHaveBeenCalledWith(mockUuidUser);
      expect(postsRepo.findOne).toHaveBeenCalledWith({
        where: { id: mockingPostUuid, authorId: mockUuidUser },
      });
      expect(postsRepo.remove).toHaveBeenCalledWith(post);
      expect(cacheService.deleteKey).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.POSTS.BY_ID}:${mockingPostUuid}`,
      );
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.POSTS.LIST}:*`,
      );
    });

    it('throws NotFoundException when post not found for user', async () => {
      const mockUserEntity: User = Object.assign(new User(), {
        id: mockUuidUser,
      } as Partial<User>);
      userService.getById.mockResolvedValue(mockUserEntity);
      postsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.deletePostById(mockUuidUser, mockingPostUuid),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('handles errors when delete fails', async () => {
      const mockUserEntity: User = Object.assign(new User(), {
        id: mockUuidUser,
      } as Partial<User>);
      userService.getById.mockResolvedValue(mockUserEntity);
      const post: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
        authorId: mockUuidUser,
      } as Partial<Post>);
      postsRepo.findOne.mockResolvedValue(post);
      postsRepo.remove.mockRejectedValue(new Error('delete-fail'));

      await expect(
        service.deletePostById(mockUuidUser, mockingPostUuid),
      ).rejects.toThrow();
    });
  });

  describe('getPostsRecently', () => {
    it('returns cached posts when available', async () => {
      const cachedResult = {
        data: [],
        meta: mockingMetadata,
      };
      cacheService.getKey.mockResolvedValue(cachedResult);

      const result = await service.getPostsRecently({});

      expect(result).toBe(cachedResult);
      expect(queryBuilder.select).not.toHaveBeenCalled();
    });

    it('returns paginated posts without search', async () => {
      cacheService.getKey.mockResolvedValue(null);
      const mockPost: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
        title: 'Test Post',
      } as Partial<Post>);

      (utils.getDataPagination as jest.Mock).mockResolvedValue({
        data: [mockPost],
        meta: mockingMetadata,
      });

      const result = await service.getPostsRecently({});

      expect(queryBuilder.select).toHaveBeenCalled();
      expect(result.data).toEqual([mockPost]);
      expect(result.meta.total).toBe(1);
      expect(cacheService.setKey).toHaveBeenCalled();
    });

    it('filters by search when provided', async () => {
      cacheService.getKey.mockResolvedValue(null);
      const mockPost: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
        title: 'Test Post',
      } as Partial<Post>);

      (utils.getDataPagination as jest.Mock).mockResolvedValue({
        data: [mockPost],
        meta: mockingMetadata,
      });

      await service.getPostsRecently({ search: 'test' });

      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(1);

      const [bracketsArg] = queryBuilder.andWhere.mock.calls[0];
      expect(bracketsArg).toBeInstanceOf(Brackets);

      const whereSpy = jest.fn().mockReturnThis();
      const orWhereSpy = jest.fn().mockReturnThis();

      (bracketsArg as Brackets).whereFactory({
        where: whereSpy,
        orWhere: orWhereSpy,
      } as any);

      expect(whereSpy).toHaveBeenCalledWith('LOWER(post.title) LIKE :search', {
        search: '%test%',
      });
      expect(orWhereSpy).toHaveBeenCalledWith(
        'LOWER(post.contents) LIKE :search',
        { search: '%test%' },
      );
    });

    it('handles errors when query fails', async () => {
      cacheService.getKey.mockResolvedValue(null);
      (utils.getDataPagination as jest.Mock).mockRejectedValue(
        new Error('query-fail'),
      );

      await expect(service.getPostsRecently({})).rejects.toThrow();
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
      expect(cacheService.deleteKey).toHaveBeenCalledTimes(2);
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.POSTS.LIST}:*`,
      );
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
      // deleteByPattern is only called when posts are found (inside if block)
      expect(cacheService.deleteByPattern).not.toHaveBeenCalled();
    });

    it('handles empty postIds array', async () => {
      queryBuilder.getMany.mockResolvedValue([]);
      queryBuilder.select.mockReturnThis();
      queryBuilder.where.mockReturnThis();

      (utils.deleteItemsInArray as jest.Mock).mockResolvedValue({
        deletedCount: 0,
        deletedIds: [],
      });

      const result = await service.delete({
        postIds: [],
      });

      expect(result.count).toBe(0);
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

  describe('getPostsRecentlyPostOfUser', () => {
    it('returns cached posts when available', async () => {
      const cachedResult = {
        data: [],
        meta: mockingMetadata,
      };
      const mockUserEntity: User = Object.assign(new User(), {
        id: mockUuidUser,
      } as Partial<User>);
      userService.getById.mockResolvedValue(mockUserEntity);
      cacheService.getKey.mockResolvedValue(cachedResult);

      const result = await service.getAllPostOfUser(mockUuidUser);

      expect(result).toBe(cachedResult);
      // Note: userService.getById is called before cache check in the service
      expect(userService.getById).toHaveBeenCalledWith(mockUuidUser);
      // But getDataPagination should not be called when cache is hit
      expect(utils.getDataPagination).not.toHaveBeenCalled();
    });

    it('returns paginated posts for user', async () => {
      cacheService.getKey.mockResolvedValue(null);
      const mockUserEntity: User = Object.assign(new User(), {
        id: mockUuidUser,
      } as Partial<User>);
      userService.getById.mockResolvedValue(mockUserEntity);
      const mockPost: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
        authorId: mockUuidUser,
      } as Partial<Post>);

      (utils.getDataPagination as jest.Mock).mockResolvedValue({
        data: [mockPost],
        meta: mockingMetadata,
      });

      const result = await service.getAllPostOfUser(mockUuidUser);

      expect(userService.getById).toHaveBeenCalledWith(mockUuidUser);
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'post.authorId = :userId',
        {
          userId: mockUuidUser,
        },
      );
      expect(result.data).toEqual([mockPost]);
      expect(cacheService.setKey).toHaveBeenCalled();
    });

    it('handles errors when query fails', async () => {
      cacheService.getKey.mockResolvedValue(null);
      const mockUserEntity: User = Object.assign(new User(), {
        id: mockUuidUser,
      } as Partial<User>);
      userService.getById.mockResolvedValue(mockUserEntity);
      (utils.getDataPagination as jest.Mock).mockRejectedValue(
        new Error('query-fail'),
      );

      await expect(service.getAllPostOfUser(mockUuidUser)).rejects.toThrow();
    });
  });
});
