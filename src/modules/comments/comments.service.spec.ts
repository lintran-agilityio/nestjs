// Libs
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

// App sources
import { AppLoggerService } from '@app/modules/logger/logger.service';
import { UserService } from '@app/modules/users/users.service';
import { PostService } from '@app/modules/posts/posts.service';
import { MESSAGES } from '@app/shared/constants';

// Local sources
import { CommentService } from './comments.service';
import { Comment } from './entities';

describe('CommentService', () => {
  let service: CommentService;
  let commentsRepo: jest.Mocked<Repository<Comment>>;
  let userService: { getById: jest.Mock };
  let postService: { getById: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: getRepositoryToken(Comment),
          useValue: {
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
          },
        },
        { provide: UserService, useValue: { getById: jest.fn() } },
        { provide: PostService, useValue: { getById: jest.fn() } },
        {
          provide: AppLoggerService,
          useValue: {
            getLoggerName: jest.fn().mockReturnValue({
              log: jest.fn(),
              error: jest.fn(),
              warn: jest.fn(),
            }),
          },
        },
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
      await expect(service.getCommentById('id-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns when exists', async () => {
      const comment = { id: 'c1' } as Comment;
      (commentsRepo.findOne as jest.Mock).mockResolvedValue(comment);
      await expect(service.getCommentById('c1')).resolves.toBe(comment);
    });
  });

  describe('createComment', () => {
    it('validates user and post then saves', async () => {
      userService.getById.mockResolvedValue({ id: 'u1' });
      postService.getById.mockResolvedValue({ id: 'p1' });
      (commentsRepo.create as jest.Mock).mockReturnValue({ content: 'hi' });
      (commentsRepo.save as jest.Mock).mockResolvedValue({ id: 'c1', content: 'hi' });

      const result = await service.createComment('u1', { postId: 'p1', content: 'hi' } as any);

      expect(userService.getById).toHaveBeenCalledWith('u1');
      expect(postService.getById).toHaveBeenCalledWith('p1');
      expect(commentsRepo.create).toHaveBeenCalled();
      expect(commentsRepo.save).toHaveBeenCalled();
      expect(result).toEqual({ id: 'c1', content: 'hi' });
    });
  });

  describe('updateCommentById', () => {
    it('throws Unauthorized if ownership mismatch', async () => {
      jest.spyOn(service, 'getCommentById').mockResolvedValue({ id: 'c1', userId: 'other' } as any);
      await expect(
        service.updateCommentById('c1', 'u1', { content: 'x' } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('updates and saves when owner matches', async () => {
      const existed = { id: 'c1', userId: 'u1', content: 'old' } as any;
      jest.spyOn(service, 'getCommentById').mockResolvedValue(existed);
      (commentsRepo.save as jest.Mock).mockResolvedValue({ ...existed, content: 'new' });

      const result = await service.updateCommentById('c1', 'u1', { content: 'new' } as any);

      expect(commentsRepo.save).toHaveBeenCalled();
      expect(result.content).toBe('new');
    });
  });

  describe('deleteCommentById', () => {
    it('throws Unauthorized if ownership mismatch', async () => {
      jest.spyOn(service, 'getCommentById').mockResolvedValue({ id: 'c1', userId: 'other' } as any);
      await expect(service.deleteCommentById('c1', 'u1')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('removes when owner matches', async () => {
      const existed = { id: 'c1', userId: 'u1' } as any;
      jest.spyOn(service, 'getCommentById').mockResolvedValue(existed);
      (commentsRepo.remove as jest.Mock).mockResolvedValue(undefined);

      const result = await service.deleteCommentById('c1', 'u1');

      expect(commentsRepo.remove).toHaveBeenCalledWith(existed);
      expect(result).toEqual({ message: MESSAGES.COMMENT_DELETE_SUCCESS });
    });
  });
});
