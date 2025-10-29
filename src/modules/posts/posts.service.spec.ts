// Libs
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

// App sources
import { AppLoggerService } from '@app/modules/logger/logger.service';
import { UserService } from '@app/modules/users/users.service';
import { MESSAGES } from '@app/shared/constants';

// Local sources
import { PostService } from './posts.service';
import { Post } from './entities';

describe('PostService', () => {
  let service: PostService;
  let postsRepo: jest.Mocked<Repository<Post>>;
  let userService: { getById: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: getRepositoryToken(Post),
          useValue: {
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
          },
        },
        {
          provide: UserService,
          useValue: { getById: jest.fn() },
        },
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
      await expect(service.getById('id-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns post when exists', async () => {
      const post = { id: 'p1' } as Post;
      (postsRepo.findOne as jest.Mock).mockResolvedValue(post);
      await expect(service.getById('p1')).resolves.toBe(post);
    });
  });

  describe('create', () => {
    it('validates user and slug uniqueness then saves', async () => {
      userService.getById.mockResolvedValue({ id: 'u1' });
      jest.spyOn(service, 'getBySlug').mockResolvedValue(null);
      (postsRepo.save as jest.Mock).mockResolvedValue({ id: 'p1', title: 't' });

      const result = await service.create('u1', { title: 't', contents: 'c', slug: 's' } as any);

      expect(userService.getById).toHaveBeenCalledWith('u1');
      expect(service.getBySlug).toHaveBeenCalledWith('s');
      expect(postsRepo.save).toHaveBeenCalledWith({ title: 't', contents: 'c', slug: 's', authorId: 'u1' });
      expect(result).toEqual({ id: 'p1', title: 't' });
    });

    it('throws when slug already exists', async () => {
      userService.getById.mockResolvedValue({ id: 'u1' });
      jest.spyOn(service, 'getBySlug').mockResolvedValue({ id: 'p1' } as Post);

      await expect(
        service.create('u1', { title: 't', contents: 'c', slug: 's' } as any),
      ).rejects.toThrow(MESSAGES.POST_SLUG_IS_EXISTED);
    });
  });

  describe('updateById', () => {
    it('updates title and contents then saves', async () => {
      const existed = { id: 'p1', title: 'old', contents: 'old' } as Post;
      jest.spyOn(service, 'getById').mockResolvedValue(existed);
      (postsRepo.save as jest.Mock).mockResolvedValue({ ...existed, title: 'new', contents: 'new' });

      const result = await service.updateById('p1', { title: 'new', contents: 'new' } as any);

      expect(service.getById).toHaveBeenCalledWith('p1');
      expect(postsRepo.save).toHaveBeenCalled();
      expect(result.title).toBe('new');
      expect(result.contents).toBe('new');
    });
  });

  describe('deleteById', () => {
    it('removes existing post', async () => {
      const existed = { id: 'p1' } as Post;
      jest.spyOn(service, 'getById').mockResolvedValue(existed);
      (postsRepo.remove as jest.Mock).mockResolvedValue(undefined);

      const result = await service.deleteById('p1');

      expect(service.getById).toHaveBeenCalledWith('p1');
      expect(postsRepo.remove).toHaveBeenCalledWith(existed);
      expect(result).toEqual({ message: MESSAGES.POST_DELETE_SUCCESS });
    });
  });

  describe('deleteUserPostById', () => {
    it('validates ownership and removes', async () => {
      userService.getById.mockResolvedValue({ id: 'u1' });
      (postsRepo.findOne as jest.Mock).mockResolvedValue({ id: 'p1', authorId: 'u1' });
      (postsRepo.remove as jest.Mock).mockResolvedValue(undefined);

      const result = await service.deleteUserPostById('u1', 'p1');

      expect(userService.getById).toHaveBeenCalledWith('u1');
      expect(postsRepo.findOne).toHaveBeenCalled();
      expect(postsRepo.remove).toHaveBeenCalled();
      expect(result).toEqual({ message: MESSAGES.POST_DELETE_SUCCESS, count: 1 });
    });
  });
});
