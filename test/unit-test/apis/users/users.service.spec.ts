// Libs
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

// App sources
import { CUSTOM_PROVIDER_TOKENS } from '@app/shared/common';
import { PostService } from '@app/apis/posts/posts.service';
import { UserRole } from '@app/shared/types';
import {
  createMockLoggerProvider,
  createRepositoryProvider,
  MOCKING_TOKEN,
  mockingUser,
  mockingUserInfo,
  mockingUserResponse,
  mockUuidUser,
} from '@app/shared/mocks';
import { CacheAbstractService } from '@app/shared/modules/cache/cache.abstract.service';
import { AuditLoggerService } from '@app/shared/modules/audit-logger/audit-logger.service';

type CacheServiceMock = jest.Mocked<
  Pick<
    CacheAbstractService,
    'getKey' | 'setKey' | 'deleteKey' | 'deleteByPattern' | 'deleteAll'
  >
>;

// Local sources
import { UserService } from '@app/apis/users/users.service';
import { User } from '@app/apis/users/entities';
import { UpdateAllUsersDto } from '@app/apis/users/dtos';

describe('UserService', () => {
  let service: UserService;
  let usersRepo: jest.Mocked<Repository<User>>;
  let postService: {
    deletePostById: jest.Mock;
    getAllPostOfUser: jest.Mock;
  };
  let hashing: { hash: jest.Mock; compare: jest.Mock };
  let cacheService: CacheServiceMock;
  let auditLogger: { logAction: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let transactionalRepository: {
    createQueryBuilder: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    count: jest.Mock;
    findOne: jest.Mock;
  };
  let transactionManager: { getRepository: jest.Mock };
  let queryBuilder: {
    select: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    orderBy: jest.Mock;
    skip: jest.Mock;
    take: jest.Mock;
    getManyAndCount: jest.Mock;
    softDelete: jest.Mock;
    execute: jest.Mock;
  };

  beforeEach(async () => {
    auditLogger = {
      logAction: jest.fn().mockResolvedValue(undefined),
    };

    queryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
      softDelete: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 0 }),
    };

    transactionalRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      save: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      count: jest.fn().mockResolvedValue(0),
      findOne: jest.fn(),
    };

    transactionManager = {
      getRepository: jest.fn().mockReturnValue(transactionalRepository),
    };

    dataSource = {
      transaction: jest.fn().mockImplementation((cb) => cb(transactionManager)),
    };

    cacheService = {
      getKey: jest.fn().mockResolvedValue(null),
      setKey: jest.fn().mockResolvedValue(undefined),
      deleteKey: jest.fn().mockResolvedValue(undefined),
      deleteByPattern: jest.fn().mockResolvedValue(undefined),
      deleteAll: jest.fn().mockResolvedValue(undefined),
    } as CacheServiceMock;

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
          useValue: {
            deletePostById: jest.fn(),
            getAllPostOfUser: jest.fn(),
          },
        },
        {
          provide: CacheAbstractService,
          useValue: cacheService,
        },
        {
          provide: AuditLoggerService,
          useValue: auditLogger,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    usersRepo = module.get(getRepositoryToken(User));
    postService = module.get(PostService);
    hashing = module.get(CUSTOM_PROVIDER_TOKENS.PASSWORD_HASHING_SERVICE);
    cacheService = module.get(CacheAbstractService);
    auditLogger = module.get(AuditLoggerService);
    dataSource = module.get(DataSource) as { transaction: jest.Mock };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUsersRecently', () => {
    it('returns paginated users without search', async () => {
      const mockUser: User = Object.assign(new User(), {
        id: mockUuidUser,
        email: 'test@example.com',
      } as Partial<User>);
      queryBuilder.getManyAndCount.mockResolvedValue([[mockUser], 1]);

      const result = await service.getUsersRecently(mockUuidUser, {});

      expect(queryBuilder.select).toHaveBeenCalled();
      expect(result.data).toEqual([mockUser]);
      expect(result.meta.total).toBe(1);
      expect(cacheService.getKey).toHaveBeenCalled();
      expect(cacheService.setKey).toHaveBeenCalled();
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(auditLogger.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUuidUser,
          data: expect.objectContaining({ servedFromCache: false }),
        }),
        transactionManager,
      );
    });

    it('returns cached users when available', async () => {
      const cachedResult = {
        data: [mockingUser],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      cacheService.getKey.mockResolvedValue(cachedResult);

      const result = await service.getUsersRecently(mockUuidUser, {});

      expect(result).toEqual(cachedResult);
      expect(queryBuilder.select).not.toHaveBeenCalled();
      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(auditLogger.logAction).toHaveBeenCalledWith({
        userId: mockUuidUser,
        action: 'LIST_USERS_RECENTLY',
        entity: 'User',
        data: {
          meta: {
            limit: 10,
            page: 1,
            total: 1,
            totalPages: 1,
          },
          servedFromCache: true,
          query: {},
        },
      });
    });

    it('filters by search when provided', async () => {
      const mockUser: User = Object.assign(new User(), {
        id: mockUuidUser,
        email: 'test@example.com',
      } as Partial<User>);
      queryBuilder.getManyAndCount.mockResolvedValue([[mockUser], 1]);

      await service.getUsersRecently(mockUuidUser, { search: 'test' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: '%test%' },
      );
    });

    it('handles errors when query fails', async () => {
      queryBuilder.getManyAndCount.mockRejectedValue(new Error('query-fail'));

      await expect(
        service.getUsersRecently(mockUuidUser, {}),
      ).rejects.toThrow();
      expect(dataSource.transaction).toHaveBeenCalled();
    });
  });

  describe('getUserByEmail', () => {
    it('returns user when found by email', async () => {
      (usersRepo.findOne as jest.Mock).mockResolvedValue(mockingUserResponse);

      const result = await service.getUserByEmail(mockingUserInfo.email);

      expect(usersRepo.findOne).toHaveBeenCalledWith({
        where: { email: mockingUserInfo.email, deletedAt: null },
      });
      expect(result).toEqual(mockingUserResponse);
    });

    it('returns null when user not found by email', async () => {
      (usersRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getUserByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('getByEmail', () => {
    it('throws NotFound when missing', async () => {
      (usersRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(
        service.getByEmail(mockingUserInfo.email),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns cached user when available', async () => {
      cacheService.getKey.mockResolvedValue(mockingUserResponse);

      const result = await service.getByEmail(mockingUserInfo.email);

      expect(result).toEqual(mockingUserResponse);
      expect(usersRepo.findOne).not.toHaveBeenCalled();
    });

    it('returns user when exists and caches it', async () => {
      (usersRepo.findOne as jest.Mock).mockResolvedValue(mockingUserResponse);

      const result = await service.getByEmail(mockingUserInfo.email);

      expect(result).toEqual(mockingUserResponse);
      expect(cacheService.setKey).toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('returns cached user when available', async () => {
      cacheService.getKey.mockResolvedValue(mockingUserResponse);

      const result = await service.getUserById(mockUuidUser);

      expect(result).toEqual(mockingUserResponse);
      expect(usersRepo.findOne).not.toHaveBeenCalled();
    });

    it('returns user when found by id', async () => {
      (usersRepo.findOne as jest.Mock).mockResolvedValue(mockingUserResponse);

      const result = await service.getUserById(mockUuidUser);

      expect(usersRepo.findOne).toHaveBeenCalledWith({
        where: { id: mockUuidUser, deletedAt: null },
      });
      expect(result).toEqual(mockingUserResponse);
      expect(cacheService.setKey).toHaveBeenCalled();
    });

    it('returns null when user not found by id', async () => {
      (usersRepo.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getUserById('non-existent-id');

      expect(result).toBeNull();
      expect(cacheService.setKey).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('throws NotFound when user missing', async () => {
      (usersRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.getById('id-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns cached user when available', async () => {
      cacheService.getKey.mockResolvedValue(mockingUserResponse);

      const result = await service.getById(mockUuidUser);

      expect(result).toEqual(mockingUserResponse);
      expect(usersRepo.findOne).not.toHaveBeenCalled();
    });

    it('returns user when exists and caches it', async () => {
      (usersRepo.findOne as jest.Mock).mockResolvedValue(mockingUserResponse);
      await expect(service.getById(mockUuidUser)).resolves.toEqual(
        mockingUserResponse,
      );
      expect(cacheService.setKey).toHaveBeenCalled();
    });
  });

  describe('getByIdOrEmail', () => {
    it('returns user by UUID when identifier is UUID', async () => {
      jest.spyOn(service, 'getById').mockResolvedValue(mockingUser);

      const result = await service.getByIdOrEmail(mockUuidUser);

      expect(service.getById).toHaveBeenCalledWith(mockUuidUser);
      expect(result).toBe(mockingUser);
    });

    it('returns user by email when identifier is email', async () => {
      jest.spyOn(service, 'getByEmail').mockResolvedValue(mockingUser);

      const result = await service.getByIdOrEmail(mockingUserInfo.email);

      expect(service.getByEmail).toHaveBeenCalledWith(mockingUserInfo.email);
      expect(result).toBe(mockingUser);
    });

    it('throws NotFoundException when identifier is invalid format', async () => {
      await expect(
        service.getByIdOrEmail('invalid-identifier'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('allows admin to access any UUID', async () => {
      jest.spyOn(service, 'getById').mockResolvedValue(mockingUser);
      const adminUser = {
        id: 'different-uuid',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      };

      const result = await service.getByIdOrEmail(mockUuidUser, adminUser);

      expect(service.getById).toHaveBeenCalledWith(mockUuidUser);
      expect(result).toBe(mockingUser);
    });

    it('allows admin to access any email', async () => {
      jest.spyOn(service, 'getByEmail').mockResolvedValue(mockingUser);
      const adminUser = {
        id: 'admin-uuid',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      };

      const result = await service.getByIdOrEmail(
        mockingUserInfo.email,
        adminUser,
      );

      expect(service.getByEmail).toHaveBeenCalledWith(mockingUserInfo.email);
      expect(result).toBe(mockingUser);
    });

    it('allows user to access their own UUID', async () => {
      jest.spyOn(service, 'getById').mockResolvedValue(mockingUser);
      const currentUser = {
        id: mockUuidUser,
        email: mockingUserInfo.email,
        role: UserRole.USER,
      };

      const result = await service.getByIdOrEmail(mockUuidUser, currentUser);

      expect(service.getById).toHaveBeenCalledWith(mockUuidUser);
      expect(result).toBe(mockingUser);
    });

    it('allows user to access their own email', async () => {
      jest.spyOn(service, 'getByEmail').mockResolvedValue(mockingUser);
      const currentUser = {
        id: mockUuidUser,
        email: mockingUserInfo.email,
        role: UserRole.USER,
      };

      const result = await service.getByIdOrEmail(
        mockingUserInfo.email,
        currentUser,
      );

      expect(service.getByEmail).toHaveBeenCalledWith(mockingUserInfo.email);
      expect(result).toBe(mockingUser);
    });

    it('throws ForbiddenException when non-admin tries to access another user UUID', async () => {
      const currentUser = {
        id: 'different-uuid',
        email: 'user@example.com',
        role: UserRole.USER,
      };

      await expect(
        service.getByIdOrEmail(mockUuidUser, currentUser),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws ForbiddenException when non-admin tries to access another user email', async () => {
      const currentUser = {
        id: mockUuidUser,
        email: 'user@example.com',
        role: UserRole.USER,
      };

      await expect(
        service.getByIdOrEmail(mockingUserInfo.email, currentUser),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('works without currentUser parameter', async () => {
      jest.spyOn(service, 'getById').mockResolvedValue(mockingUser);

      const result = await service.getByIdOrEmail(mockUuidUser);

      expect(service.getById).toHaveBeenCalledWith(mockUuidUser);
      expect(result).toBe(mockingUser);
    });
  });

  describe('updateRefreshToken', () => {
    it('updates refresh token', async () => {
      await service.updateRefreshToken(mockUuidUser, MOCKING_TOKEN);
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(transactionalRepository.update).toHaveBeenCalledWith(
        mockUuidUser,
        {
          refreshToken: MOCKING_TOKEN,
        },
      );
    });
  });

  describe('updateAll', () => {
    it('hashes password and saves each user', async () => {
      jest.spyOn(service, 'getById').mockResolvedValue(mockingUser);
      hashing.hash.mockResolvedValue('hashed');
      transactionalRepository.findOne.mockResolvedValue(mockingUser);
      transactionalRepository.save.mockResolvedValue({ id: mockUuidUser });

      const result = await service.updateAll({
        users: [{ id: mockUuidUser, password: 'x' }],
      } as UpdateAllUsersDto);

      expect(hashing.hash).toHaveBeenCalledWith('x');
      expect(result).toEqual([{ id: mockUuidUser }]);
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(transactionalRepository.save).toHaveBeenCalled();
    });

    it('handles errors when update fails', async () => {
      jest.spyOn(service, 'getById').mockResolvedValue(mockingUser);
      hashing.hash.mockResolvedValue('hashed');
      transactionalRepository.findOne.mockResolvedValue(mockingUser);
      transactionalRepository.save.mockRejectedValue(new Error('save-fail'));

      await expect(
        service.updateAll({
          users: [{ id: mockUuidUser, password: 'x' }],
        } as UpdateAllUsersDto),
      ).rejects.toThrow();
    });
  });

  describe('updateById', () => {
    it('hashes password conditionally and updates', async () => {
      const existingUser = Object.assign(new User(), {
        ...mockingUser,
        password: 'stored-pass',
      } as Partial<User>);
      jest.spyOn(service, 'getById').mockResolvedValue(existingUser);
      hashing.hash.mockResolvedValue('hashed');
      transactionalRepository.findOne.mockResolvedValue(existingUser);
      const savedUser = { ...mockingUser, password: 'hashed' };
      transactionalRepository.save.mockResolvedValue(savedUser);

      const result = await service.updateById('u1', { password: 'new' });

      expect(hashing.hash).toHaveBeenCalledWith('new');
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(transactionalRepository.save).toHaveBeenCalled();
      expect(auditLogger.logAction).toHaveBeenCalled();
      expect(result).toMatchObject({
        id: mockingUser.id,
        email: mockingUser.email,
      });
      expect(
        (result as unknown as { password?: string }).password,
      ).toBeUndefined();
    });

    it('handles error when update fails', async () => {
      const existingUser = Object.assign(new User(), {
        ...mockingUser,
        password: 'stored-pass',
      } as Partial<User>);
      jest.spyOn(service, 'getById').mockResolvedValue(existingUser);
      hashing.hash.mockResolvedValue('hashed');
      (usersRepo.merge as jest.Mock).mockImplementation((entity, payload) => ({
        ...entity,
        ...payload,
      }));
      (usersRepo.save as jest.Mock).mockRejectedValue(new Error('update-fail'));

      await expect(
        service.updateById('u1', { password: 'new' }),
      ).rejects.toThrow();
    });

    it('does not hash password when not provided', async () => {
      const existingUser = Object.assign(new User(), {
        ...mockingUser,
        password: 'stored-pass',
      } as Partial<User>);
      jest.spyOn(service, 'getById').mockResolvedValue(existingUser);
      transactionalRepository.findOne.mockResolvedValue(existingUser);
      transactionalRepository.save.mockResolvedValue(existingUser);

      await service.updateById('u1', {});

      expect(hashing.hash).not.toHaveBeenCalled();
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(transactionalRepository.save).toHaveBeenCalled();
    });
  });

  describe('deleteAll', () => {
    it('throws when nothing to delete', async () => {
      transactionalRepository.count.mockResolvedValue(0);
      await expect(service.deleteAll(mockUuidUser)).rejects.toThrow(
        'No users for delete',
      );
    });

    it('returns message and count when deleted', async () => {
      transactionalRepository.count.mockResolvedValue(2);
      queryBuilder.execute.mockResolvedValue({ affected: 2 });

      const result = await service.deleteAll(mockUuidUser);
      expect(result).toEqual({
        message: 'Deleted 2 users successfully.',
        count: 2,
      });
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(transactionalRepository.count).toHaveBeenCalled();
      expect(queryBuilder.softDelete).toHaveBeenCalled();
      expect(queryBuilder.execute).toHaveBeenCalled();
      expect(auditLogger.logAction).toHaveBeenCalled();
    });

    it('handles errors when delete fails', async () => {
      (usersRepo.find as jest.Mock).mockResolvedValue([{ id: mockUuidUser }]);
      (usersRepo.createQueryBuilder as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        execute: jest.fn().mockRejectedValue(new Error('delete-fail')),
      });

      await expect(service.deleteAll(mockUuidUser)).rejects.toThrow();
    });
  });

  describe('deleteById', () => {
    it('removes the user', async () => {
      jest.spyOn(service, 'getById').mockResolvedValue(mockingUser);
      transactionalRepository.findOne.mockResolvedValue(mockingUser);
      queryBuilder.execute.mockResolvedValue({ affected: 1 });

      const result = await service.deleteById('u1');
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(queryBuilder.softDelete).toHaveBeenCalled();
      expect(queryBuilder.where).toHaveBeenCalled();
      expect(queryBuilder.execute).toHaveBeenCalled();
      expect(auditLogger.logAction).toHaveBeenCalled();
      expect(cacheService.deleteKey).toHaveBeenCalled();
      expect(cacheService.deleteByPattern).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('handles error when remove fails', async () => {
      jest.spyOn(service, 'getById').mockResolvedValue(mockingUser);
      transactionalRepository.findOne.mockResolvedValue(mockingUser);
      queryBuilder.execute.mockRejectedValue(new Error('remove-fail'));

      await expect(service.deleteById('u1')).rejects.toThrow();
    });
  });

  describe('deletePostById', () => {
    it('delegates to PostService', async () => {
      postService.deletePostById.mockResolvedValue(undefined);
      const result = await service.deletePostById('u1', 'p1');
      expect(postService.deletePostById).toHaveBeenCalledWith('u1', 'p1');
      expect(result).toBeUndefined();
    });
  });

  describe('getAllPostOfUser', () => {
    it('delegates to PostService', async () => {
      const mockPostResponse = {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
      postService.getAllPostOfUser.mockResolvedValue(mockPostResponse);

      const result = await service.getAllPostOfUser(mockUuidUser);

      expect(postService.getAllPostOfUser).toHaveBeenCalledWith(mockUuidUser);
      expect(result).toEqual(mockPostResponse);
    });
  });
});
