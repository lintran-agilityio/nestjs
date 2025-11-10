// Libs
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

// Apis sources
import { UserService } from '@app/apis/users/users.service';
import { PostService } from '@app/apis/posts/posts.service';
import { User } from '@app/apis/users/entities';
import { Post } from '@app/apis/posts/entities';

// App sources
import { MESSAGES, TTL_CACHE, REDIS_CACHE_KEYS } from '@app/shared/constants';
import {
  createMockLoggerProvider,
  createRepositoryProvider,
  mockingCommentInfo,
  mockingCommentUuid,
  mockingMetadata,
  mockingPostUuid,
  mockUuidUser,
  mockingUserResponse,
} from '@app/shared/mocks';
import { CacheAbstractService } from '@app/shared/modules/cache/cache.abstract.service';
import * as utils from '@app/shared/utils';
import { UserRole } from '@app/shared/types';

// Local sources
import { CommentService } from './comments.service';
import { Comment } from './entities';

jest.mock('@app/shared/utils', () => ({
  ...jest.requireActual('@app/shared/utils'),
  deleteItemsInArray: jest.fn(),
}));

describe('CommentService', () => {
  let service: CommentService;
  let commentsRepo: {
    findOne: jest.Mock<Promise<Comment | null>, [object]>;
    create: jest.Mock<Comment, [Partial<Comment>]>;
    save: jest.Mock<Promise<Comment>, [Comment]>;
    remove: jest.Mock<Promise<Comment>, [Comment]>;
    createQueryBuilder: jest.Mock;
  };
  let userService: { getById: jest.Mock<Promise<User>, [string]> };
  let postService: { getById: jest.Mock<Promise<Post>, [string]> };
  let cacheService: {
    getKey: jest.Mock;
    setKey: jest.Mock;
    deleteKey: jest.Mock;
    deleteByPattern: jest.Mock;
  };
  const mockComment: Comment = Object.assign(new Comment(), {
    ...mockingCommentInfo,
    id: mockingCommentUuid,
    userId: mockUuidUser,
    postId: mockingPostUuid,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Partial<Comment>);

  let queryBuilder: {
    leftJoinAndSelect: jest.Mock;
    select: jest.Mock;
    andWhere: jest.Mock;
    where: jest.Mock;
    orderBy: jest.Mock;
    skip: jest.Mock;
    take: jest.Mock;
    getManyAndCount: jest.Mock;
    getMany: jest.Mock;
  };
  const differentUserId = '22222222-2222-2222-2222-222222222222';

  beforeEach(async () => {
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        createRepositoryProvider<Comment>(Comment, {
          findOne: jest.fn(),
          create: jest.fn(),
          save: jest.fn(),
          remove: jest.fn(),
          createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
        }),
        { provide: UserService, useValue: { getById: jest.fn() } },
        { provide: PostService, useValue: { getById: jest.fn() } },
        { provide: CacheAbstractService, useValue: cacheService },
        createMockLoggerProvider(),
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);
    commentsRepo = module.get(getRepositoryToken(Comment));
    userService = module.get(UserService);
    postService = module.get(PostService);
    cacheService = module.get(CacheAbstractService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCommentById', () => {
    it('throws NotFound when missing', async () => {
      cacheService.getKey.mockResolvedValue(null);
      commentsRepo.findOne.mockResolvedValue(null);
      await expect(service.getCommentById('id-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns cached comment when available', async () => {
      cacheService.getKey.mockResolvedValue(mockComment);

      const result = await service.getCommentById(mockingCommentUuid);

      expect(result).toEqual(mockComment);
      expect(commentsRepo.findOne).not.toHaveBeenCalled();
      expect(cacheService.getKey).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.COMMENTS.BY_ID}:${mockingCommentUuid}`,
      );
    });

    it('returns when exists and caches result', async () => {
      const comment: Comment = Object.assign(new Comment(), {
        id: mockingCommentUuid,
        user: { id: mockUuidUser },
        post: { id: mockingPostUuid },
      } as Partial<Comment>);
      cacheService.getKey.mockResolvedValue(null);
      commentsRepo.findOne.mockResolvedValue(comment);

      const result = await service.getCommentById(mockingCommentUuid);

      expect(result).toBe(comment);
      expect(cacheService.setKey).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.COMMENTS.BY_ID}:${mockingCommentUuid}`,
        comment,
        TTL_CACHE.COMMENT_BY_ID,
      );
    });

    it('does not cache when comment not found', async () => {
      cacheService.getKey.mockResolvedValue(null);
      commentsRepo.findOne.mockResolvedValue(null);

      await expect(service.getCommentById('id-1')).rejects.toThrow();

      expect(cacheService.setKey).not.toHaveBeenCalled();
    });
  });

  describe('createComment', () => {
    it('validates user and post then saves', async () => {
      const mockUser: User = Object.assign(new User(), {
        id: mockUuidUser,
      } as Partial<User>);
      const mockPost: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
      } as Partial<Post>);
      userService.getById.mockResolvedValue(mockUser);
      postService.getById.mockResolvedValue(mockPost);
      const createdComment: Comment = Object.assign(new Comment(), {
        content: mockingCommentInfo.content,
      } as Partial<Comment>);
      commentsRepo.create.mockReturnValue(createdComment);
      const savedComment: Comment = Object.assign(new Comment(), {
        id: mockingCommentUuid,
        content: mockingCommentInfo.content,
      } as Partial<Comment>);
      commentsRepo.save.mockResolvedValue(savedComment);

      const result = await service.createComment(mockUuidUser, {
        postId: mockingPostUuid,
        content: 'hi',
      });

      expect(userService.getById).toHaveBeenCalledWith(mockUuidUser);
      expect(postService.getById).toHaveBeenCalledWith(mockingPostUuid);
      expect(commentsRepo.create).toHaveBeenCalledWith({
        content: 'hi',
        userId: mockUuidUser,
        postId: mockingPostUuid,
      });
      expect(commentsRepo.save).toHaveBeenCalled();
      expect(result).toEqual(savedComment);
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.COMMENTS.LIST}:*`,
      );
      expect(cacheService.setKey).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.COMMENTS.BY_ID}:${savedComment.id}`,
        savedComment,
        TTL_CACHE.COMMENT_BY_ID,
      );
    });

    it('throws when user not found', async () => {
      userService.getById.mockRejectedValue(
        new NotFoundException(MESSAGES.USER_NOT_FOUND),
      );

      await expect(
        service.createComment(mockUuidUser, {
          postId: mockingPostUuid,
          content: 'hi',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when post not found', async () => {
      const mockUser: User = Object.assign(new User(), {
        id: mockUuidUser,
      } as Partial<User>);
      userService.getById.mockResolvedValue(mockUser);
      postService.getById.mockRejectedValue(
        new NotFoundException(MESSAGES.POST_NOT_FOUND),
      );

      await expect(
        service.createComment(mockUuidUser, {
          postId: mockingPostUuid,
          content: 'hi',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when repository save fails', async () => {
      const mockUser: User = Object.assign(new User(), {
        id: mockUuidUser,
      } as Partial<User>);
      const mockPost: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
      } as Partial<Post>);
      userService.getById.mockResolvedValue(mockUser);
      postService.getById.mockResolvedValue(mockPost);
      const createdComment: Comment = Object.assign(new Comment(), {
        content: mockingCommentInfo.content,
      } as Partial<Comment>);
      commentsRepo.create.mockReturnValue(createdComment);
      commentsRepo.save.mockRejectedValue(new Error('save-fail'));

      await expect(
        service.createComment(mockUuidUser, {
          postId: mockingPostUuid,
          content: 'hi',
        }),
      ).rejects.toThrow();
    });
  });

  describe('updateCommentById', () => {
    it('throws Unauthorized if ownership mismatch', async () => {
      jest.spyOn(service, 'getCommentById').mockResolvedValue(mockComment);
      await expect(
        service.updateCommentById(mockingCommentUuid, differentUserId, {
          content: mockingCommentInfo.content,
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('updates and saves when owner matches', async () => {
      const existed = Object.assign(new Comment(), {
        id: mockingCommentUuid,
        userId: mockUuidUser,
        content: 'old',
        postId: mockingPostUuid,
      } as Partial<Comment>);
      jest.spyOn(service, 'getCommentById').mockResolvedValue(existed);
      const updatedComment = Object.assign(new Comment(), {
        ...existed,
        content: 'new',
      } as Partial<Comment>);
      commentsRepo.save.mockResolvedValue(updatedComment);

      const result = await service.updateCommentById(
        mockingCommentUuid,
        mockUuidUser,
        {
          content: 'new',
        },
      );

      expect(commentsRepo.save).toHaveBeenCalled();
      expect(result.content).toBe('new');
      expect(cacheService.deleteKey).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.COMMENTS.BY_ID}:${mockingCommentUuid}`,
      );
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.COMMENTS.LIST}:*`,
      );
      expect(cacheService.setKey).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.COMMENTS.BY_ID}:${updatedComment.id}`,
        updatedComment,
        TTL_CACHE.COMMENT_BY_ID,
      );
    });

    it('handles error when save fails', async () => {
      const existed = Object.assign(new Comment(), {
        id: mockingCommentUuid,
        userId: mockUuidUser,
        content: 'old',
        postId: mockingPostUuid,
      } as Partial<Comment>);
      jest.spyOn(service, 'getCommentById').mockResolvedValue(existed);
      commentsRepo.save.mockRejectedValue(new Error('save-fail'));

      await expect(
        service.updateCommentById(mockingCommentUuid, mockUuidUser, {
          content: 'new',
        }),
      ).rejects.toThrow();
    });
  });

  describe('deleteCommentById', () => {
    it('throws Unauthorized if ownership mismatch and user is not admin', async () => {
      const comment = Object.assign(new Comment(), {
        id: mockingCommentUuid,
        userId: differentUserId,
      } as Partial<Comment>);
      jest.spyOn(service, 'getCommentById').mockResolvedValue(comment);
      const user = {
        id: mockUuidUser,
        email: mockingUserResponse.email,
        role: UserRole.USER,
        status: mockingUserResponse.status,
        firstName: mockingUserResponse.firstName,
        lastName: mockingUserResponse.lastName,
      };

      await expect(
        service.deleteCommentById(mockingCommentUuid, user),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('allows admin to delete any comment', async () => {
      const comment = Object.assign(new Comment(), {
        id: mockingCommentUuid,
        userId: differentUserId,
      } as Partial<Comment>);
      jest.spyOn(service, 'getCommentById').mockResolvedValue(comment);
      commentsRepo.remove.mockResolvedValue(comment);
      const adminUser = {
        id: mockUuidUser,
        email: mockingUserResponse.email,
        role: UserRole.ADMIN,
        status: mockingUserResponse.status,
        firstName: mockingUserResponse.firstName,
        lastName: mockingUserResponse.lastName,
      };

      const result = await service.deleteCommentById(
        mockingCommentUuid,
        adminUser,
      );

      expect(commentsRepo.remove).toHaveBeenCalledWith(comment);
      expect(result).toEqual({ message: MESSAGES.COMMENT_DELETE_SUCCESS });
      expect(cacheService.deleteKey).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.COMMENTS.BY_ID}:${mockingCommentUuid}`,
      );
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.COMMENTS.LIST}:*`,
      );
    });

    it('removes when owner matches', async () => {
      const existed = Object.assign(new Comment(), {
        id: mockingCommentUuid,
        userId: mockUuidUser,
        content: mockingCommentInfo.content,
        postId: mockingPostUuid,
      } as Partial<Comment>);
      jest.spyOn(service, 'getCommentById').mockResolvedValue(existed);
      commentsRepo.remove.mockResolvedValue(existed);
      const user = {
        id: mockUuidUser,
        email: mockingUserResponse.email,
        role: UserRole.USER,
        status: mockingUserResponse.status,
        firstName: mockingUserResponse.firstName,
        lastName: mockingUserResponse.lastName,
      };

      const result = await service.deleteCommentById(
        mockingCommentUuid,
        user,
      );

      expect(commentsRepo.remove).toHaveBeenCalledWith(existed);
      expect(result).toEqual({ message: MESSAGES.COMMENT_DELETE_SUCCESS });
      expect(cacheService.deleteKey).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.COMMENTS.BY_ID}:${mockingCommentUuid}`,
      );
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.COMMENTS.LIST}:*`,
      );
    });

    it('handles error when remove fails', async () => {
      const existed = Object.assign(new Comment(), {
        id: mockingCommentUuid,
        userId: mockUuidUser,
        content: mockingCommentInfo.content,
        postId: mockingPostUuid,
      } as Partial<Comment>);
      jest.spyOn(service, 'getCommentById').mockResolvedValue(existed);
      commentsRepo.remove.mockRejectedValue(new Error('remove-fail'));
      const user = {
        id: mockUuidUser,
        email: mockingUserResponse.email,
        role: UserRole.USER,
        status: mockingUserResponse.status,
        firstName: mockingUserResponse.firstName,
        lastName: mockingUserResponse.lastName,
      };

      await expect(
        service.deleteCommentById(mockingCommentUuid, user),
      ).rejects.toThrow();
    });
  });

  describe('getComments', () => {
    it('returns cached comments when available', async () => {
      const cachedResult = {
        data: [mockComment],
        meta: mockingMetadata,
      };
      cacheService.getKey.mockResolvedValue(cachedResult);

      const result = await service.getComments({});

      expect(result).toEqual(cachedResult);
      expect(queryBuilder.select).not.toHaveBeenCalled();
      expect(cacheService.getKey).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.COMMENTS.LIST}:${JSON.stringify({})}`,
      );
    });

    it('returns paginated comments without filters', async () => {
      const mockData = [mockComment];
      cacheService.getKey.mockResolvedValue(null);
      queryBuilder.getManyAndCount.mockResolvedValue([mockData, 1]);
      queryBuilder.orderBy.mockReturnThis();
      queryBuilder.skip.mockReturnThis();
      queryBuilder.take.mockReturnThis();

      // Mock getDataPagination by spying on the actual implementation
      const getDataPaginationSpy = jest.spyOn(utils, 'getDataPagination');
      getDataPaginationSpy.mockResolvedValue({
        data: mockData,
        meta: mockingMetadata,
      });

      const result = await service.getComments({});

      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalled();
      expect(queryBuilder.select).toHaveBeenCalled();
      expect(cacheService.setKey).toHaveBeenCalled();
      getDataPaginationSpy.mockRestore();
    });

    it('filters by postId when provided', async () => {
      const mockData = [mockComment];
      cacheService.getKey.mockResolvedValue(null);
      queryBuilder.getManyAndCount.mockResolvedValue([mockData, 1]);

      const getDataPaginationSpy = jest.spyOn(utils, 'getDataPagination');
      getDataPaginationSpy.mockResolvedValue({
        data: mockData,
        meta: mockingMetadata,
      });

      await service.getComments({ postId: mockingPostUuid });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'comment.postId = :postId',
        { postId: mockingPostUuid },
      );
      getDataPaginationSpy.mockRestore();
    });

    it('filters by search when provided', async () => {
      const mockData = [mockComment];
      cacheService.getKey.mockResolvedValue(null);
      queryBuilder.getManyAndCount.mockResolvedValue([mockData, 1]);

      const getDataPaginationSpy = jest.spyOn(utils, 'getDataPagination');
      getDataPaginationSpy.mockResolvedValue({
        data: mockData,
        meta: mockingMetadata,
      });

      await service.getComments({ search: 'test' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'comment.content ILIKE :search',
        { search: '%test%' },
      );
      getDataPaginationSpy.mockRestore();
    });

    it('filters by both postId and search when provided', async () => {
      const mockData = [mockComment];
      cacheService.getKey.mockResolvedValue(null);
      queryBuilder.getManyAndCount.mockResolvedValue([mockData, 1]);

      const getDataPaginationSpy = jest.spyOn(utils, 'getDataPagination');
      getDataPaginationSpy.mockResolvedValue({
        data: mockData,
        meta: mockingMetadata,
      });

      await service.getComments({
        postId: mockingPostUuid,
        search: 'test',
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(2);
      getDataPaginationSpy.mockRestore();
    });

    it('handles errors when query fails', async () => {
      cacheService.getKey.mockResolvedValue(null);
      queryBuilder.getManyAndCount.mockRejectedValue(new Error('query-fail'));

      const getDataPaginationSpy = jest.spyOn(utils, 'getDataPagination');
      getDataPaginationSpy.mockRejectedValue(new Error('query-fail'));

      await expect(service.getComments({})).rejects.toThrow();

      getDataPaginationSpy.mockRestore();
    });
  });

  describe('updateCommentById', () => {
    it('handles error when save fails', async () => {
      const existed = Object.assign(new Comment(), {
        id: mockingCommentUuid,
        userId: mockUuidUser,
        content: 'old',
        postId: mockingPostUuid,
      } as Partial<Comment>);
      jest.spyOn(service, 'getCommentById').mockResolvedValue(existed);
      commentsRepo.save.mockRejectedValue(new Error('save-fail'));

      await expect(
        service.updateCommentById(mockingCommentUuid, mockUuidUser, {
          content: 'new',
        }),
      ).rejects.toThrow();
    });
  });

  describe('deleteComments', () => {
    it('deletes comments by ids successfully', async () => {
      const comment1 = Object.assign(new Comment(), {
        id: mockingCommentUuid,
        userId: mockUuidUser,
      } as Partial<Comment>);
      const comment2 = Object.assign(new Comment(), {
        id: differentUserId,
        userId: mockUuidUser,
      } as Partial<Comment>);

      queryBuilder.getMany.mockResolvedValue([comment1, comment2]);
      queryBuilder.select.mockReturnThis();
      queryBuilder.where.mockReturnThis();

      (utils.deleteItemsInArray as jest.Mock).mockResolvedValue({
        deletedCount: 2,
        deletedIds: [mockingCommentUuid, differentUserId],
      });

      const result = await service.deleteComments({
        commentIds: [mockingCommentUuid, differentUserId],
      });

      expect(result.count).toBe(2);
      expect(result.message).toBeDefined();
      expect(cacheService.deleteKey).toHaveBeenCalledTimes(2);
      expect(cacheService.deleteByPattern).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.COMMENTS.LIST}:*`,
      );
    });

    it('handles comments not found', async () => {
      queryBuilder.getMany.mockResolvedValue([]);
      queryBuilder.select.mockReturnThis();
      queryBuilder.where.mockReturnThis();

      (utils.deleteItemsInArray as jest.Mock).mockResolvedValue({
        deletedCount: 0,
        deletedIds: [],
      });

      const result = await service.deleteComments({
        commentIds: ['non-existent-id'],
      });

      expect(result.count).toBe(0);
      expect(result.message).toContain('comment');
      expect(cacheService.deleteKey).not.toHaveBeenCalled();
      // When no comments are found, deleteByPattern is not called since existingComments.length === 0
      expect(cacheService.deleteByPattern).not.toHaveBeenCalled();
    });

    it('handles empty commentIds array', async () => {
      (utils.deleteItemsInArray as jest.Mock).mockResolvedValue({
        deletedCount: 0,
        deletedIds: [],
      });

      const result = await service.deleteComments({ commentIds: [] });

      expect(result.count).toBe(0);
      expect(result.message).toBeDefined();
      // When commentIds is empty, findCommentsByIds returns early without querying
      expect(queryBuilder.where).not.toHaveBeenCalled();
      // When no comments to delete, deleteByPattern is not called
      expect(cacheService.deleteByPattern).not.toHaveBeenCalled();
    });

    it('handles partial deletion when some comments exist', async () => {
      const comment1 = Object.assign(new Comment(), {
        id: mockingCommentUuid,
        userId: mockUuidUser,
      } as Partial<Comment>);
      const nonExistentId = '33333333-3333-3333-3333-333333333333';

      queryBuilder.getMany.mockResolvedValue([comment1]);
      queryBuilder.select.mockReturnThis();
      queryBuilder.where.mockReturnThis();

      (utils.deleteItemsInArray as jest.Mock).mockResolvedValue({
        deletedCount: 1,
        deletedIds: [mockingCommentUuid],
      });

      const result = await service.deleteComments({
        commentIds: [mockingCommentUuid, nonExistentId],
      });

      expect(result.count).toBe(1);
      expect(result.message).toContain('1 comment');
      expect(cacheService.deleteKey).toHaveBeenCalledTimes(1);
    });

    it('handles errors when delete fails', async () => {
      queryBuilder.getMany.mockRejectedValue(new Error('find-fail'));
      queryBuilder.select.mockReturnThis();
      queryBuilder.where.mockReturnThis();

      await expect(
        service.deleteComments({ commentIds: [mockingCommentUuid] }),
      ).rejects.toThrow();
    });

    it('handles errors when deleteItemsInArray fails', async () => {
      const comment1 = Object.assign(new Comment(), {
        id: mockingCommentUuid,
        userId: mockUuidUser,
      } as Partial<Comment>);

      queryBuilder.getMany.mockResolvedValue([comment1]);
      queryBuilder.select.mockReturnThis();
      queryBuilder.where.mockReturnThis();

      (utils.deleteItemsInArray as jest.Mock).mockRejectedValue(
        new Error('delete-fail'),
      );

      await expect(
        service.deleteComments({ commentIds: [mockingCommentUuid] }),
      ).rejects.toThrow();
    });
  });

  describe('getCommentsByPostId', () => {
    it('validates post and returns comments', async () => {
      const mockPost: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
      } as Partial<Post>);
      postService.getById.mockResolvedValue(mockPost);
      jest.spyOn(service, 'getComments').mockResolvedValue({
        data: [mockComment],
        meta: mockingMetadata,
      });

      const result = await service.getCommentsByPostId(mockingPostUuid, {});

      expect(postService.getById).toHaveBeenCalledWith(mockingPostUuid);
      expect(service.getComments).toHaveBeenCalledWith({
        postId: mockingPostUuid,
      });
      expect(result.data).toEqual([mockComment]);
    });

    it('passes query params to getComments', async () => {
      const mockPost: Post = Object.assign(new Post(), {
        id: mockingPostUuid,
      } as Partial<Post>);
      postService.getById.mockResolvedValue(mockPost);
      jest.spyOn(service, 'getComments').mockResolvedValue({
        data: [mockComment],
        meta: mockingMetadata,
      });

      const queryParams = { page: 2, limit: 20 };
      await service.getCommentsByPostId(mockingPostUuid, queryParams);

      expect(service.getComments).toHaveBeenCalledWith({
        ...queryParams,
        postId: mockingPostUuid,
      });
    });

    it('throws when post not found', async () => {
      postService.getById.mockRejectedValue(
        new NotFoundException(MESSAGES.POST_NOT_FOUND),
      );
      const getCommentsSpy = jest.spyOn(service, 'getComments');

      await expect(
        service.getCommentsByPostId(mockingPostUuid, {}),
      ).rejects.toThrow(NotFoundException);
      expect(getCommentsSpy).not.toHaveBeenCalled();
      getCommentsSpy.mockRestore();
    });
  });
});
