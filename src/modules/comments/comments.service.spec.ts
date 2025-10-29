// Libs
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

// App sources
import { UserService } from '@app/modules/users/users.service';
import { PostService } from '@app/modules/posts/posts.service';
import { MESSAGES } from '@app/shared/constants';
import {
  createMockLoggerProvider,
  createRepositoryProvider,
  mockingCommentInfo,
  mockingCommentUuid,
  mockingPostUuid,
  mockUuidUser,
} from '@app/shared/mocks';

// Local sources
import { CommentService } from './comments.service';
import { Comment } from './entities';

describe('CommentService', () => {
  let service: CommentService;
  let commentsRepo: jest.Mocked<Repository<Comment>>;
  let userService: { getById: jest.Mock };
  let postService: { getById: jest.Mock };
  const mockComment: Comment = Object.assign(new Comment(), {
    ...mockingCommentInfo,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Partial<Comment>);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        createRepositoryProvider<Comment>(Comment, {
          findOne: jest.fn(),
          create: jest.fn(),
          save: jest.fn(),
          remove: jest.fn(),
          createQueryBuilder: jest.fn().mockReturnValue({
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
          }),
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
      (commentsRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.getCommentById('id-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns when exists', async () => {
      const comment = { id: mockingCommentUuid };
      (commentsRepo.findOne as jest.Mock).mockResolvedValue(comment);
      await expect(service.getCommentById(mockingCommentUuid)).resolves.toBe(
        comment,
      );
    });
  });

  describe('createComment', () => {
    it('validates user and post then saves', async () => {
      userService.getById.mockResolvedValue({ id: mockUuidUser });
      postService.getById.mockResolvedValue({ id: mockingPostUuid });
      (commentsRepo.create as jest.Mock).mockReturnValue({
        content: mockingCommentInfo.content,
      });
      (commentsRepo.save as jest.Mock).mockResolvedValue({
        id: 'c1',
        content: 'hi',
      });

      const result = await service.createComment('u1', {
        postId: 'p1',
        content: 'hi',
      });

      expect(userService.getById).toHaveBeenCalledWith(mockUuidUser);
      expect(postService.getById).toHaveBeenCalledWith(mockingPostUuid);
      expect(commentsRepo.create).toHaveBeenCalled();
      expect(commentsRepo.save).toHaveBeenCalled();
      expect(result).toEqual({
        id: mockingCommentUuid,
        content: mockingCommentInfo.content,
      });
    });
  });

  describe('updateCommentById', () => {
    it('throws Unauthorized if ownership mismatch', async () => {
      jest.spyOn(service, 'getCommentById').mockResolvedValue(mockComment);
      await expect(
        service.updateCommentById(mockingCommentUuid, mockUuidUser, {
          content: mockingCommentInfo.content,
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('updates and saves when owner matches', async () => {
      const existed = {
        id: mockingCommentUuid,
        userId: mockUuidUser,
        content: 'old',
      };
      jest.spyOn(service, 'getCommentById').mockResolvedValue(existed);
      (commentsRepo.save as jest.Mock).mockResolvedValue({
        ...existed,
        content: 'new',
      });

      const result = await service.updateCommentById('c1', 'u1', {
        content: 'new',
      });

      expect(commentsRepo.save).toHaveBeenCalled();
      expect(result.content).toBe('new');
    });
  });

  describe('deleteCommentById', () => {
    it('throws Unauthorized if ownership mismatch', async () => {
      jest.spyOn(service, 'getCommentById').mockResolvedValue(mockComment);
      await expect(
        service.deleteCommentById('c1', 'u1'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('removes when owner matches', async () => {
      const existed = { id: mockingCommentUuid, userId: mockUuidUser };
      jest.spyOn(service, 'getCommentById').mockResolvedValue(existed);
      (commentsRepo.remove as jest.Mock).mockResolvedValue(undefined);

      const result = await service.deleteCommentById('c1', 'u1');

      expect(commentsRepo.remove).toHaveBeenCalledWith(existed);
      expect(result).toEqual({ message: MESSAGES.COMMENT_DELETE_SUCCESS });
    });
  });
});
