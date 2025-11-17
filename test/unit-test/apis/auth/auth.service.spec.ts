// Libs
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';

// App sources
import { CUSTOM_PROVIDER_TOKENS } from '@app/shared/common';
import { MESSAGES, REDIS_CACHE_KEYS, TTL_CACHE } from '@app/shared/constants';
import {
  UserRole,
  UserStatus,
  IJwtAuthPayload,
} from '@app/shared/types';
import { CacheAbstractService } from '@app/shared/modules/cache/cache.abstract.service';
import { HashingAbstractService } from '@app/shared/modules/hashing/hashing.abstract.service';
import { AuditLoggerService } from '@app/shared/modules/audit-logger/audit-logger.service';

// Apis
import { UserService } from '@app/apis/users/users.service';
import { User } from '@app/apis/users/entities';

// Local sources
import { AuthService } from '@app/apis/auth/auth.service';
import {
  LoginRequestDto,
  RegisterRequestDto,
  RegisterResponseDto,
} from '@app/apis/auth/dto';
import {
  mockingUserInfo,
  mockingUserLogin,
  mockingUserRegister,
  mockUuidUser,
  createMockLoggerProvider,
  createRepositoryProvider,
} from '@app/shared/mocks';

// Type definitions for mocks
type HashingServiceMock = {
  hash: jest.Mock<Promise<string>, [string]>;
  compare: jest.Mock<Promise<boolean>, [string, string]>;
};

type ConfigServiceMock = {
  get: jest.Mock;
};

type JwtServiceMock = {
  signAsync: jest.Mock<Promise<string>, [object, object?]>;
  verifyAsync: jest.Mock<Promise<IJwtAuthPayload>, [string, object?]>;
};

type UserServiceMock = {
  getUserByEmail: jest.Mock<Promise<User | null>, [string]>;
  getUserById: jest.Mock<Promise<User | null>, [string]>;
  updateRefreshToken: jest.Mock<Promise<void>, [string, string]>;
};

type CacheServiceMock = {
  getKey: jest.Mock<Promise<string | null>, [string]>;
  setKey: jest.Mock<Promise<void>, [string, unknown, number?]>;
  deleteKey: jest.Mock<Promise<void>, [string]>;
  deleteByPattern: jest.Mock<Promise<void>, [string]>;
};

type AuditLoggerServiceMock = {
  logAction: jest.Mock<Promise<void>, [object, EntityManager?]>;
};

type DataSourceMock = {
  transaction: jest.Mock;
};

describe('AuthService', () => {
  let service: AuthService;
  let usersRepo: jest.Mocked<Repository<User>>;
  let hashingService: HashingServiceMock;
  let configService: ConfigServiceMock;
  let jwtService: JwtServiceMock;
  let userService: UserServiceMock;
  let cacheService: CacheServiceMock;
  let auditLoggerService: AuditLoggerServiceMock;
  let dataSource: DataSourceMock;
  let transactionManager: jest.Mocked<EntityManager>;
  let transactionalRepo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    cacheService = {
      getKey: jest.fn().mockResolvedValue(null),
      setKey: jest.fn().mockResolvedValue(undefined),
      deleteKey: jest.fn().mockResolvedValue(undefined),
      deleteByPattern: jest.fn().mockResolvedValue(undefined),
    };

    auditLoggerService = {
      logAction: jest.fn().mockResolvedValue(undefined),
    };

    transactionalRepo = {
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    transactionManager = {
      getRepository: jest.fn().mockReturnValue(transactionalRepo),
    } as unknown as jest.Mocked<EntityManager>;

    dataSource = {
      transaction: jest.fn().mockImplementation(async <T>(
        callback: (manager: EntityManager) => Promise<T>,
      ): Promise<T> => {
        return callback(transactionManager);
      }),
    } as unknown as DataSourceMock;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        createRepositoryProvider<User>(User),
        {
          provide: CUSTOM_PROVIDER_TOKENS.PASSWORD_HASHING_SERVICE,
          useValue: {
            hash: jest.fn<Promise<string>, [string]>(),
            compare: jest.fn<Promise<boolean>, [string, string]>(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn<Promise<string>, [object, object?]>(),
            verifyAsync: jest.fn<Promise<IJwtAuthPayload>, [string, object?]>(),
          },
        },
        {
          provide: UserService,
          useValue: {
            getUserByEmail: jest.fn<Promise<User | null>, [string]>(),
            getUserById: jest.fn<Promise<User | null>, [string]>(),
            updateRefreshToken: jest.fn<Promise<void>, [string, string]>(),
          },
        },
        { provide: CacheAbstractService, useValue: cacheService },
        { provide: AuditLoggerService, useValue: auditLoggerService },
        { provide: DataSource, useValue: dataSource },
        createMockLoggerProvider(),
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepo = module.get(getRepositoryToken(User));
    hashingService = module.get(
      CUSTOM_PROVIDER_TOKENS.PASSWORD_HASHING_SERVICE,
    ) as HashingServiceMock;
    configService = module.get(ConfigService) as unknown as ConfigServiceMock;
    jwtService = module.get(JwtService) as unknown as JwtServiceMock;
    userService = module.get(UserService) as unknown as UserServiceMock;
    cacheService = module.get(CacheAbstractService) as unknown as CacheServiceMock;
    auditLoggerService = module.get(AuditLoggerService) as unknown as AuditLoggerServiceMock;
    dataSource = module.get(DataSource) as unknown as DataSourceMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const dto: RegisterRequestDto = new RegisterRequestDto(mockingUserRegister);

    it('should throw ConflictException if user exists', async () => {
      const existingUser: Partial<User> = { id: '1' };
      userService.getUserByEmail.mockResolvedValue(existingUser as User);

      await expect(service.register(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(usersRepo.create).not.toHaveBeenCalled();
    });

    it('should create and return RegisterResponseDto on success', async () => {
      userService.getUserByEmail.mockResolvedValue(null);
      hashingService.hash.mockResolvedValue('hashed');
      const saved: Partial<User> = {
        id: 'uuid-1234',
        email: dto.email,
        status: UserStatus.ACTIVE,
      };
      transactionalRepo.create.mockReturnValue({} as User);
      transactionalRepo.save.mockResolvedValue(saved as User);

      const result = await service.register(dto);

      expect(result).toBeInstanceOf(RegisterResponseDto);
      expect(result).toEqual({
        id: saved.id,
        email: saved.email,
        role: UserRole.USER,
        status: saved.status,
      });
      expect(hashingService.hash).toHaveBeenCalledWith(dto.password);
      expect(transactionalRepo.create).toHaveBeenCalled();
      expect(transactionalRepo.save).toHaveBeenCalled();
      expect(auditLoggerService.logAction).toHaveBeenCalled();
      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should handle errors during registration', async () => {
      userService.getUserByEmail.mockResolvedValue(null);
      hashingService.hash.mockResolvedValue('hashed');
      transactionalRepo.create.mockReturnValue({} as User);
      transactionalRepo.save.mockRejectedValue(new Error('Database error'));

      await expect(service.register(dto)).rejects.toThrow();
    });
  });

  describe('login', () => {
    const dto: LoginRequestDto = new LoginRequestDto(mockingUserLogin);

    it('should throw UnauthorizedException if user not found', async () => {
      userService.getUserByEmail.mockResolvedValue(null);
      await expect(service.login(dto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('should throw error with wrong password message when password invalid', async () => {
      const existingUser: Partial<User> = {
        id: 'u1',
        email: dto.email,
        password: 'hashed',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      };
      userService.getUserByEmail.mockResolvedValue(existingUser as User);
      hashingService.compare.mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(
        MESSAGES.USER_WRONG_PASSWORD,
      );
    });

    it('should return tokens and user on success', async () => {
      const existing: Partial<User> = {
        id: 'u1',
        email: dto.email,
        password: 'hashed',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      };
      userService.getUserByEmail.mockResolvedValue(existing as User);
      hashingService.compare.mockResolvedValue(true);
      hashingService.hash.mockResolvedValue('hashed.refresh');
      configService.get
        .mockReturnValueOnce('jwt-secret') // JWT_SECRET
        .mockReturnValueOnce('1h') // JWT_EXPIRES_IN
        .mockReturnValueOnce('refresh-secret') // JWT_REFRESH_SECRET
        .mockReturnValueOnce('7d'); // JWT_REFRESH_EXPIRES_IN
      jwtService.signAsync
        .mockResolvedValueOnce('access.token')
        .mockResolvedValueOnce('refresh.token');
      transactionalRepo.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.login(dto);

      expect(result).toEqual({
        accessToken: 'access.token',
        refreshToken: 'refresh.token',
        user: {
          id: existing.id,
          email: existing.email,
          role: existing.role,
          status: existing.status,
        },
      });
      expect(cacheService.setKey).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.REFRESH_TOKEN}:${existing.id}`,
        'hashed.refresh',
        TTL_CACHE.REFRESH_TOKEN,
      );
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(transactionalRepo.update).toHaveBeenCalledWith(
        existing.id,
        { refreshToken: 'hashed.refresh' },
      );
      expect(auditLoggerService.logAction).toHaveBeenCalled();
    });

    it('should use default config values when configService returns null/undefined', async () => {
      const existing: Partial<User> = {
        id: 'u1',
        email: dto.email,
        password: 'hashed',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      };
      userService.getUserByEmail.mockResolvedValue(existing as User);
      hashingService.compare.mockResolvedValue(true);
      hashingService.hash.mockResolvedValue('hashed.refresh');
      // Return null/undefined to trigger fallback defaults
      configService.get.mockReturnValue(null);
      jwtService.signAsync
        .mockResolvedValueOnce('access.token')
        .mockResolvedValueOnce('refresh.token');

      const result = await service.login(dto);

      expect(result).toBeDefined();
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      // Verify default values are used in signAsync calls
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          id: 'u1',
          email: dto.email,
        }),
        expect.objectContaining({
          secret: 'super-secret',
          expiresIn: '1h',
        }),
      );
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          id: 'u1',
          email: dto.email,
        }),
        expect.objectContaining({
          secret: 'super-refresh-secret',
          expiresIn: '7d',
        }),
      );
    });

    it('should handle errors during login', async () => {
      const existing: Partial<User> = {
        id: 'u1',
        email: dto.email,
        password: 'hashed',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      };
      userService.getUserByEmail.mockResolvedValue(existing as User);
      hashingService.compare.mockResolvedValue(true);
      configService.get.mockReturnValue('secret');
      jwtService.signAsync.mockRejectedValue(new Error('JWT error'));

      await expect(service.login(dto)).rejects.toThrow();
    });
  });

  describe('refreshTokens', () => {
    it('should throw error when JWT verification fails', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(service.refreshTokens('invalid.token')).rejects.toThrow();
    });

    it('should use cached refresh token when available', async () => {
      const payload: IJwtAuthPayload = {
        id: mockUuidUser,
        ...mockingUserInfo,
      };
      jwtService.verifyAsync.mockResolvedValue(payload);
      cacheService.getKey.mockResolvedValue('cached.hashed.refresh');
      hashingService.compare.mockResolvedValue(true);
      hashingService.hash.mockResolvedValue('hashed.new.refresh');
      configService.get
        .mockReturnValueOnce('refresh-secret') // JWT_REFRESH_SECRET (verify)
        .mockReturnValueOnce('jwt-secret') // JWT_SECRET
        .mockReturnValueOnce('1h') // JWT_EXPIRES_IN
        .mockReturnValueOnce('refresh-secret') // JWT_REFRESH_SECRET (rotate)
        .mockReturnValueOnce('7d'); // JWT_REFRESH_EXPIRES_IN
      jwtService.signAsync
        .mockResolvedValueOnce('new.access.token')
        .mockResolvedValueOnce('new.refresh.token');
      transactionalRepo.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.refreshTokens('valid.refresh.token');

      expect(result).toEqual({
        accessToken: 'new.access.token',
        refreshToken: 'new.refresh.token',
      });
      expect(cacheService.getKey).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.REFRESH_TOKEN}:${mockUuidUser}`,
      );
      expect(userService.getUserById).not.toHaveBeenCalled();
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(hashingService.hash).toHaveBeenCalledWith('new.refresh.token');
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(transactionalRepo.update).toHaveBeenCalledWith(
        mockUuidUser,
        { refreshToken: 'hashed.new.refresh' },
      );
      expect(auditLoggerService.logAction).toHaveBeenCalled();
      expect(cacheService.deleteKey).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.REFRESH_TOKEN}:${mockUuidUser}`,
      );
      expect(cacheService.setKey).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.REFRESH_TOKEN}:${mockUuidUser}`,
        'hashed.new.refresh',
        TTL_CACHE.REFRESH_TOKEN,
      );
    });

    it('should throw error when cached refresh token is invalid', async () => {
      const payload: IJwtAuthPayload = {
        id: mockUuidUser,
        ...mockingUserInfo,
      };
      jwtService.verifyAsync.mockResolvedValue(payload);
      cacheService.getKey.mockResolvedValue('cached.hashed.refresh');
      hashingService.compare.mockResolvedValue(false);

      await expect(
        service.refreshTokens('invalid.refresh.token'),
      ).rejects.toThrow(MESSAGES.USER_INVALID_REFRESH_TOKEN);
    });

    it('should throw error when user missing or stored token absent', async () => {
      const payload: Partial<IJwtAuthPayload> = { id: 'u1' };
      jwtService.verifyAsync.mockResolvedValue(payload as IJwtAuthPayload);
      cacheService.getKey.mockResolvedValue(null);
      const userWithoutToken: Partial<User> = {
        id: 'u1',
        refreshToken: undefined,
      };
      userService.getUserById.mockResolvedValue(userWithoutToken as User);

      await expect(service.refreshTokens('any.refresh')).rejects.toThrow(
        MESSAGES.USER_INVALID_REFRESH_TOKEN,
      );
    });

    it('should throw error when user not found', async () => {
      const payload: Partial<IJwtAuthPayload> = { id: 'u1' };
      jwtService.verifyAsync.mockResolvedValue(payload as IJwtAuthPayload);
      cacheService.getKey.mockResolvedValue(null);
      userService.getUserById.mockResolvedValue(null);

      await expect(service.refreshTokens('any.refresh')).rejects.toThrow(
        MESSAGES.USER_INVALID_REFRESH_TOKEN,
      );
    });

    it('should throw error when stored refresh token mismatches', async () => {
      const payload: Partial<IJwtAuthPayload> = { id: 'u1' };
      jwtService.verifyAsync.mockResolvedValue(payload as IJwtAuthPayload);
      cacheService.getKey.mockResolvedValue(null);
      const userWithToken: Partial<User> = {
        id: 'u1',
        refreshToken: 'stored.hash',
      };
      userService.getUserById.mockResolvedValue(userWithToken as User);
      hashingService.compare.mockResolvedValue(false);

      await expect(service.refreshTokens('incoming.refresh')).rejects.toThrow(
        MESSAGES.USER_INVALID_REFRESH_TOKEN,
      );
    });

    it('should return new tokens using DB stored token when cache is missing', async () => {
      const payload: IJwtAuthPayload = {
        id: mockUuidUser,
        ...mockingUserInfo,
      };
      jwtService.verifyAsync.mockResolvedValue(payload);
      cacheService.getKey.mockResolvedValue(null);
      const userWithToken: Partial<User> = {
        id: mockUuidUser,
        refreshToken: 'stored.hash',
      };
      userService.getUserById.mockResolvedValue(userWithToken as User);
      hashingService.compare.mockResolvedValue(true);
      hashingService.hash.mockResolvedValue('hashed.new.refresh');
      configService.get
        .mockReturnValueOnce('refresh-secret') // JWT_REFRESH_SECRET (verify)
        .mockReturnValueOnce('jwt-secret') // JWT_SECRET
        .mockReturnValueOnce('1h') // JWT_EXPIRES_IN
        .mockReturnValueOnce('refresh-secret') // JWT_REFRESH_SECRET (rotate)
        .mockReturnValueOnce('7d'); // JWT_REFRESH_EXPIRES_IN
      jwtService.signAsync
        .mockResolvedValueOnce('new.access.token')
        .mockResolvedValueOnce('new.refresh.token');
      transactionalRepo.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.refreshTokens('incoming.refresh');

      expect(result).toEqual({
        accessToken: 'new.access.token',
        refreshToken: 'new.refresh.token',
      });
      expect(cacheService.getKey).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.REFRESH_TOKEN}:${mockUuidUser}`,
      );
      expect(userService.getUserById).toHaveBeenCalledWith(mockUuidUser);
      expect(hashingService.compare).toHaveBeenCalledWith(
        'incoming.refresh',
        'stored.hash',
      );
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(hashingService.hash).toHaveBeenCalledWith('new.refresh.token');
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(transactionalRepo.update).toHaveBeenCalledWith(
        mockUuidUser,
        { refreshToken: 'hashed.new.refresh' },
      );
      expect(auditLoggerService.logAction).toHaveBeenCalled();
      expect(cacheService.deleteKey).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.REFRESH_TOKEN}:${mockUuidUser}`,
      );
      expect(cacheService.setKey).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.REFRESH_TOKEN}:${mockUuidUser}`,
        'hashed.new.refresh',
        TTL_CACHE.REFRESH_TOKEN,
      );
    });

    it('should use default config values when refreshing tokens with null config', async () => {
      const payload: IJwtAuthPayload = {
        id: mockUuidUser,
        ...mockingUserInfo,
      };
      jwtService.verifyAsync.mockResolvedValue(payload);
      cacheService.getKey.mockResolvedValue(null);
      const userWithToken: Partial<User> = {
        id: mockUuidUser,
        refreshToken: 'stored.hash',
      };
      userService.getUserById.mockResolvedValue(userWithToken as User);
      hashingService.compare.mockResolvedValue(true);
      configService.get.mockReturnValue(null);
      hashingService.hash.mockResolvedValue('hashed.new.refresh');
      jwtService.signAsync
        .mockResolvedValueOnce('new.access.token')
        .mockResolvedValueOnce('new.refresh.token');
      transactionalRepo.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.refreshTokens('incoming.refresh');

      expect(result).toEqual({
        accessToken: 'new.access.token',
        refreshToken: 'new.refresh.token',
      });
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          id: mockUuidUser,
          email: mockingUserInfo.email,
        }),
        expect.objectContaining({
          secret: 'super-secret',
          expiresIn: '1h',
        }),
      );
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          id: mockUuidUser,
          email: mockingUserInfo.email,
        }),
        expect.objectContaining({
          secret: 'super-refresh-secret',
          expiresIn: '7d',
        }),
      );
    });

    it('should handle errors during token refresh', async () => {
      const payload: IJwtAuthPayload = {
        id: mockUuidUser,
        ...mockingUserInfo,
      };
      jwtService.verifyAsync.mockResolvedValue(payload);
      cacheService.getKey.mockResolvedValue(null);
      const userWithToken: Partial<User> = {
        id: mockUuidUser,
        refreshToken: 'stored.hash',
      };
      userService.getUserById.mockResolvedValue(userWithToken as User);
      hashingService.compare.mockResolvedValue(true);
      configService.get.mockReturnValue('secret');
      jwtService.signAsync.mockRejectedValue(new Error('Sign error'));

      await expect(service.refreshTokens('incoming.refresh')).rejects.toThrow();
    });
  });
});
