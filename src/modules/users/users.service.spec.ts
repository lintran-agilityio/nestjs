// Libs
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

// App sources
import { CUSTOM_PROVIDER_TOKENS } from '@app/shared/common';
import { PostService } from '@app/modules/posts/posts.service';
import { MESSAGES } from '@app/shared/constants';
import {
  createMockLoggerProvider,
  createRepositoryProvider,
  MOCKING_TOKEN,
  mockingPostUuid,
  mockingUser,
  mockingUserInfo,
  mockingUserRegister,
  mockingUserResponse,
  mockUuidUser,
} from '@app/shared/mocks';

// Local sources
import { UserService } from './users.service';
import { User } from './entities';
import { UpdateAllUsersDto } from './dtos';

describe('UserService', () => {
  let service: UserService;
  let usersRepo: jest.Mocked<Repository<User>>;
  let postService: { deleteUserPostById: jest.Mock };
  let hashing: { hash: jest.Mock; compare: jest.Mock };
  let queryBuilder: {
    select: jest.Mock;
    andWhere: jest.Mock;
    orderBy: jest.Mock;
    skip: jest.Mock;
    take: jest.Mock;
    getManyAndCount: jest.Mock;
  };

  beforeEach(async () => {
    queryBuilder = {
      select: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        createRepositoryProvider<User>(User, {
          findOne: jest.fn(),
          find: jest.fn(),
          update: jest.fn(),
          remove: jest.fn(),
          save: jest.fn(),
          merge: jest.fn(),
          createQueryBuilder: jest.fn().mockReturnValue({
            delete: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({ affected: 0 }),
            select: queryBuilder.select,
            andWhere: queryBuilder.andWhere,
            orderBy: queryBuilder.orderBy,
            skip: queryBuilder.skip,
            take: queryBuilder.take,
            getManyAndCount: queryBuilder.getManyAndCount,
          }),
        }),
        {
          provide: CUSTOM_PROVIDER_TOKENS.PASSWORD_HASHING_SERVICE,
          useValue: { hash: jest.fn(), compare: jest.fn() },
        },
        createMockLoggerProvider(),
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
      await expect(service.getById('id-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns user when exists', async () => {
      (usersRepo.findOne as jest.Mock).mockResolvedValue(mockingUserResponse);
      await expect(service.getById(mockUuidUser)).resolves.toBe(
        mockingUserResponse,
      );
    });
  });

  describe('getByEmail', () => {
    it('throws NotFound when missing', async () => {
      (usersRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(
        service.getByEmail(mockingUserInfo.email),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateRefreshToken', () => {
    it('updates refresh token', async () => {
      (usersRepo.update as jest.Mock).mockResolvedValue(undefined);
      await service.updateRefreshToken(mockUuidUser, MOCKING_TOKEN);
      expect(usersRepo.update).toHaveBeenCalledWith(mockUuidUser, {
        refreshToken: MOCKING_TOKEN,
      });
    });
  });

  describe('updateAll', () => {
    it('hashes password and saves each user', async () => {
      jest.spyOn(service, 'getById').mockResolvedValue(mockingUser);
      hashing.hash.mockResolvedValue('hashed');
      (usersRepo.merge as jest.Mock).mockImplementation((e, d) => ({
        ...e,
        ...d,
      }));
      (usersRepo.save as jest.Mock).mockResolvedValue({ id: mockUuidUser });

      const result = await service.updateAll({
        users: [{ id: mockUuidUser, password: 'x' }],
      } as UpdateAllUsersDto);

      expect(hashing.hash).toHaveBeenCalledWith('x');
      expect(result).toEqual([{ id: mockUuidUser }]);
    });
  });

  describe('updateById', () => {
    it('hashes password conditionally and updates', async () => {
      jest.spyOn(service, 'getById').mockResolvedValue(mockingUser);
      hashing.hash.mockResolvedValue('hashed');
      (usersRepo.update as jest.Mock).mockResolvedValue(undefined);

      const result = await service.updateById('u1', { password: 'new' });

      expect(hashing.hash).toHaveBeenCalledWith('new');
      expect(usersRepo.update).toHaveBeenCalled();
      expect(result).toEqual({
        message: `User id - u1 updated successfully`,
      });
    });
  });

  describe('deleteAll', () => {
    it('throws when nothing to delete', async () => {
      (usersRepo.find as jest.Mock).mockResolvedValue([]);
      await expect(service.deleteAll()).rejects.toThrow('No users for delete');
    });

    it('returns message and count when deleted', async () => {
      (usersRepo.find as jest.Mock).mockResolvedValue([{ id: mockUuidUser }]);
      (usersRepo.createQueryBuilder as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 2 }),
      });

      const result = await service.deleteAll();
      expect(result).toEqual({
        message: 'Deleted 2 users successfully.',
        count: 2,
      });
    });
  });

  describe('deleteById', () => {
    it('removes the user', async () => {
      jest.spyOn(service, 'getById').mockResolvedValue(mockingUser);
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
      expect(postService.deleteUserPostById).toHaveBeenCalledWith(
        'u1',
        'p1',
      );
      expect(result).toEqual({ message: 'ok' });
    });
  });

  describe('getAll', () => {
    it('returns paginated users without search', async () => {
      const mockUser: User = Object.assign(new User(), {
        id: mockUuidUser,
        email: 'test@example.com',
      } as Partial<User>);
      queryBuilder.getManyAndCount.mockResolvedValue([[mockUser], 1]);

      const result = await service.getAll({});

      expect(queryBuilder.select).toHaveBeenCalled();
      expect(result.data).toEqual([mockUser]);
      expect(result.meta.total).toBe(1);
    });

    it('filters by search when provided', async () => {
      const mockUser: User = Object.assign(new User(), {
        id: mockUuidUser,
        email: 'test@example.com',
      } as Partial<User>);
      queryBuilder.getManyAndCount.mockResolvedValue([[mockUser], 1]);

      await service.getAll({ search: 'test' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: '%test%' },
      );
    });

    it('handles errors when query fails', async () => {
      queryBuilder.getManyAndCount.mockRejectedValue(new Error('query-fail'));

      await expect(service.getAll({})).rejects.toThrow();
    });
  });

  describe('getUserByEmail', () => {
    it('returns user when found by email', async () => {
      (usersRepo.findOne as jest.Mock).mockResolvedValue(mockingUserResponse);

      const result = await service.getUserByEmail(mockingUserInfo.email);

      expect(usersRepo.findOne).toHaveBeenCalledWith({
        where: { email: mockingUserInfo.email },
      });
      expect(result).toBe(mockingUserResponse);
    });

    it('returns null when user not found by email', async () => {
      (usersRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getUserByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('returns user when found by id', async () => {
      (usersRepo.findOne as jest.Mock).mockResolvedValue(mockingUserResponse);

      const result = await service.getUserById(mockUuidUser);

      expect(usersRepo.findOne).toHaveBeenCalledWith({
        where: { id: mockUuidUser },
      });
      expect(result).toBe(mockingUserResponse);
    });

    it('returns null when user not found by id', async () => {
      (usersRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getUserById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('updateById', () => {
    it('handles error when update fails', async () => {
      jest.spyOn(service, 'getById').mockResolvedValue(mockingUser);
      hashing.hash.mockResolvedValue('hashed');
      (usersRepo.update as jest.Mock).mockRejectedValue(
        new Error('update-fail'),
      );

      await expect(
        service.updateById('u1', { password: 'new' }),
      ).rejects.toThrow();
    });

    it('does not hash password when not provided', async () => {
      jest.spyOn(service, 'getById').mockResolvedValue(mockingUser);
      (usersRepo.update as jest.Mock).mockResolvedValue(undefined);

      await service.updateById('u1', {});

      expect(hashing.hash).not.toHaveBeenCalled();
      expect(usersRepo.update).toHaveBeenCalled();
    });
  });

  describe('deleteAll', () => {
    it('handles errors when delete fails', async () => {
      (usersRepo.find as jest.Mock).mockResolvedValue([{ id: mockUuidUser }]);
      (usersRepo.createQueryBuilder as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        execute: jest.fn().mockRejectedValue(new Error('delete-fail')),
      });

      await expect(service.deleteAll()).rejects.toThrow();
    });
  });

  describe('deleteById', () => {
    it('handles error when remove fails', async () => {
      jest.spyOn(service, 'getById').mockResolvedValue(mockingUser);
      (usersRepo.remove as jest.Mock).mockRejectedValue(
        new Error('remove-fail'),
      );

      await expect(service.deleteById('u1')).rejects.toThrow();
    });
  });
});
