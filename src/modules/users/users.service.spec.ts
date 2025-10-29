// Libs
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

// App sources
import { CUSTOM_PROVIDER_TOKENS } from '@app/shared/common';
import { AppLoggerService } from '@app/modules/logger/logger.service';
import { PostService } from '@app/modules/posts/posts.service';
import { MESSAGES } from '@app/shared/constants';

// Local sources
import { UserService } from './users.service';
import { User } from './entities';

describe('UserService', () => {
  let service: UserService;
  let usersRepo: jest.Mocked<Repository<User>>;
  let postService: { deleteUserPostById: jest.Mock };
  let hashing: { hash: jest.Mock; compare: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            save: jest.fn(),
            merge: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
              delete: jest.fn().mockReturnThis(),
              execute: jest.fn().mockResolvedValue({ affected: 0 }),
            }),
          },
        },
        {
          provide: CUSTOM_PROVIDER_TOKENS.PASSWORD_HASHING_SERVICE,
          useValue: { hash: jest.fn(), compare: jest.fn() },
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
        {
          provide: PostService,
          useValue: { deleteUserPostById: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    usersRepo = module.get(getRepositoryToken(User));
    postService = module.get(PostService);
    hashing = module.get(CUSTOM_PROVIDER_TOKENS.PASSWORD_HASHING_SERVICE);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getById', () => {
    it('throws NotFound when user missing', async () => {
      (usersRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.getById('id-1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns user when exists', async () => {
      const user = { id: 'u1' } as User;
      (usersRepo.findOne as jest.Mock).mockResolvedValue(user);
      await expect(service.getById('u1')).resolves.toBe(user);
    });
  });

  describe('getByEmail', () => {
    it('throws NotFound when missing', async () => {
      (usersRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.getByEmail('a@b.c')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateRefreshToken', () => {
    it('updates refresh token', async () => {
      (usersRepo.update as jest.Mock).mockResolvedValue(undefined);
      await service.updateRefreshToken('u1', 'r');
      expect(usersRepo.update).toHaveBeenCalledWith('u1', { refreshToken: 'r' });
    });
  });

  describe('updateAll', () => {
    it('hashes password and saves each user', async () => {
      jest.spyOn(service, 'getById').mockResolvedValue({ id: 'u1', password: 'p' } as any);
      hashing.hash.mockResolvedValue('hashed');
      (usersRepo.merge as jest.Mock).mockImplementation((e, d) => ({ ...e, ...d }));
      (usersRepo.save as jest.Mock).mockResolvedValue({ id: 'u1' });

      const result = await service.updateAll({ users: [{ id: 'u1', password: 'x' }] } as any);

      expect(hashing.hash).toHaveBeenCalledWith('x');
      expect(usersRepo.save).toHaveBeenCalled();
      expect(result).toEqual([{ id: 'u1' }]);
    });
  });

  describe('updateById', () => {
    it('hashes password conditionally and updates', async () => {
      jest.spyOn(service, 'getById').mockResolvedValue({ id: 'u1', password: 'old' } as any);
      hashing.hash.mockResolvedValue('hashed');
      (usersRepo.update as jest.Mock).mockResolvedValue(undefined);

      const result = await service.updateById('u1', { password: 'new' } as any);

      expect(hashing.hash).toHaveBeenCalledWith('new');
      expect(usersRepo.update).toHaveBeenCalled();
      expect(result).toEqual({ message: 'User id - u1 updated successfully' });
    });
  });

  describe('deleteAll', () => {
    it('throws when nothing to delete', async () => {
      (usersRepo.find as jest.Mock).mockResolvedValue([]);
      await expect(service.deleteAll()).rejects.toThrow('No users for delete');
    });

    it('returns message and count when deleted', async () => {
      (usersRepo.find as jest.Mock).mockResolvedValue([{ id: 'u1' }]);
      (usersRepo.createQueryBuilder as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 2 }),
      });

      const result = await service.deleteAll();
      expect(result).toEqual({ message: 'Deleted 2 users successfully.', count: 2 });
    });
  });

  describe('deleteById', () => {
    it('removes the user', async () => {
      jest.spyOn(service, 'getById').mockResolvedValue({ id: 'u1' } as any);
      (usersRepo.remove as jest.Mock).mockResolvedValue(undefined);
      const result = await service.deleteById('u1');
      expect(usersRepo.remove).toHaveBeenCalled();
      expect(result).toEqual({ message: MESSAGES.USER_DELETE_SUCCESS });
    });
  });

  describe('deletePostById', () => {
    it('delegates to PostService', async () => {
      postService.deleteUserPostById.mockResolvedValue({ message: 'ok' });
      const result = await service.deletePostById('u1', 'p1');
      expect(postService.deleteUserPostById).toHaveBeenCalledWith('u1', 'p1');
      expect(result).toEqual({ message: 'ok' });
    });
  });
});
