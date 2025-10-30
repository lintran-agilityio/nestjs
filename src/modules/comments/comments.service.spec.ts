// Libs
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

// App sources
import { UserService } from '@app/modules/users/users.service';
import { PostService } from '@app/modules/posts/posts.service';
import { User } from '@app/modules/users/entities';
import { Post } from '@app/modules/posts/entities';
import { MESSAGES } from '@app/shared/constants';
import {
  createMockLoggerProvider,
  createRepositoryProvider,
  mockingCommentInfo,
  mockingCommentUuid,
  mockingMetadata,
  mockingPostUuid,
  mockUuidUser,
} from '@app/shared/mocks';
import * as utils from '@app/shared/utils';

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
  };
  let userService: { getById: jest.Mock<Promise<User>, [string]> };
  let postService: { getById: jest.Mock<Promise<Post>, [string]> };
  const mockComment: Comment = Object.assign(new Comment(), {
    ...mockingCommentInfo,
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
        createMockLoggerProvider(),
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);
    commentsRepo = module.get(getRepositoryToken(Comment));
    userService = module.get(UserService);
    postService = module.get(PostService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCommentById', () => {
    it('throws NotFound when missing', async () => {
      commentsRepo.findOne.mockResolvedValue(null);
      await expect(service.getCommentById('id-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns when exists', async () => {
      const comment: Comment = Object.assign(new Comment(), {
        id: mockingCommentUuid,
      } as Partial<Comment>);
      commentsRepo.findOne.mockResolvedValue(comment);
      await expect(service.getCommentById(mockingCommentUuid)).resolves.toBe(
        comment,
      );
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
      expect(commentsRepo.create).toHaveBeenCalled();
      expect(commentsRepo.save).toHaveBeenCalled();
      expect(result).toEqual(savedComment);
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
    });
  });

  describe('deleteCommentById', () => {
    it('throws Unauthorized if ownership mismatch', async () => {
      jest.spyOn(service, 'getCommentById').mockResolvedValue(mockComment);
      await expect(
        service.deleteCommentById(mockingCommentUuid, mockUuidUser),
      ).rejects.toBeInstanceOf(UnauthorizedException);
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

      const result = await service.deleteCommentById(
        mockingCommentUuid,
        mockUuidUser,
      );

      expect(commentsRepo.remove).toHaveBeenCalledWith(existed);
      expect(result).toEqual({ message: MESSAGES.COMMENT_DELETE_SUCCESS });
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

      await expect(
        service.deleteCommentById(mockingCommentUuid, mockUuidUser),
      ).rejects.toThrow();
    });
  });

  describe('getComments', () => {
    it('returns paginated comments without filters', async () => {
      const mockData = [mockComment];
      queryBuilder.getManyAndCount.mockResolvedValue([mockData, 1]);
      queryBuilder.orderBy.mockReturnThis();
      queryBuilder.skip.mockReturnThis();
      queryBuilder.take.mockReturnThis();

      const result = await service.getComments({});

      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalled();
      expect(queryBuilder.select).toHaveBeenCalled();
      expect(result.data).toEqual(mockData);
      expect(result.meta.total).toBe(1);
    });

    it('filters by postId when provided', async () => {
      const mockData = [mockComment];
      queryBuilder.getManyAndCount.mockResolvedValue([mockData, 1]);

      await service.getComments({ postId: mockingPostUuid });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'comment.postId = :postId',
        { postId: mockingPostUuid },
      );
    });

    it('filters by search when provided', async () => {
      const mockData = [mockComment];
      queryBuilder.getManyAndCount.mockResolvedValue([mockData, 1]);

      await service.getComments({ search: 'test' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'comment.content ILIKE :search',
        { search: '%test%' },
      );
    });

    it('handles errors when query fails', async () => {
      queryBuilder.getManyAndCount.mockRejectedValue(new Error('query-fail'));

      await expect(service.getComments({})).rejects.toThrow();
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
    });

    it('handles errors when delete fails', async () => {
      queryBuilder.getMany.mockRejectedValue(new Error('find-fail'));
      queryBuilder.select.mockReturnThis();
      queryBuilder.where.mockReturnThis();

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
  });
});
