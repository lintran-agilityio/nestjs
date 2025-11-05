// Libs
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// App sources
import { CUSTOM_PROVIDER_TOKENS } from '@app/shared/common';
import { MESSAGES, REDIS_CACHE_KEYS, TTL_CACHE } from '@app/shared/constants';
import { UserRole, UserStatus } from '@app/shared/types';
import { RedisService } from '@app/shared/modules/cache/redis/redis.service';

// Apis
import { UserService } from '@app/apis/users/users.service';
import { User } from '@app/apis/users/entities';

// Local sources
import { AuthService } from './auth.service';
import {
  LoginRequestDto,
  RegisterRequestDto,
  RegisterResponseDto,
} from './dto';
import {
  mockingUserInfo,
  mockingUserLogin,
  mockingUserRegister,
  mockUuidUser,
  createMockLoggerProvider,
  createRepositoryProvider,
} from '@app/shared/mocks';

describe('AuthService', () => {
  let service: AuthService;
  let usersRepo: jest.Mocked<Repository<User>>;
  let hashingService: { hash: jest.Mock; compare: jest.Mock };
  let configService: { get: jest.Mock };
  let jwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let userService: {
    getUserByEmail: jest.Mock;
    getUserById: jest.Mock;
    updateRefreshToken: jest.Mock;
  };
  let redisService: {
    getKey: jest.Mock;
    setKey: jest.Mock;
  };

  beforeEach(async () => {
    redisService = {
      getKey: jest.fn().mockResolvedValue(null),
      setKey: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        createRepositoryProvider<User>(User),
        {
          provide: CUSTOM_PROVIDER_TOKENS.PASSWORD_HASHING_SERVICE,
          useValue: { hash: jest.fn(), compare: jest.fn() },
        },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn(), verifyAsync: jest.fn() },
        },
        {
          provide: UserService,
          useValue: {
            getUserByEmail: jest.fn(),
            getUserById: jest.fn(),
            updateRefreshToken: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: redisService,
        },
        createMockLoggerProvider(),
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepo = module.get(getRepositoryToken(User));
    hashingService = module.get(
      CUSTOM_PROVIDER_TOKENS.PASSWORD_HASHING_SERVICE,
    );
    configService = module.get(ConfigService);
    jwtService = module.get(JwtService);
    userService = module.get(UserService);
    redisService = module.get(RedisService);
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
      userService.getUserByEmail.mockResolvedValue({ id: '1' } as User);

      await expect(service.register(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(usersRepo.create).not.toHaveBeenCalled();
    });

    it('should create and return RegisterResponseDto on success', async () => {
      userService.getUserByEmail.mockResolvedValue(null);
      hashingService.hash.mockResolvedValue('hashed');
      const saved = {
        id: 'uuid-1234',
        email: dto.email,
        status: UserStatus.ACTIVE,
      } as User;
      (usersRepo.create as jest.Mock).mockReturnValue({} as User);
      (usersRepo.save as jest.Mock).mockResolvedValue(saved);

      const result = await service.register(dto);

      expect(result).toBeInstanceOf(RegisterResponseDto);
      expect(result).toEqual({
        id: saved.id,
        email: saved.email,
        role: UserRole.USER,
        status: saved.status,
      });
      expect(hashingService.hash).toHaveBeenCalledWith(dto.password);
      expect(usersRepo.create).toHaveBeenCalled();
      expect(usersRepo.save).toHaveBeenCalled();
    });

    it('should handle errors during registration', async () => {
      userService.getUserByEmail.mockResolvedValue(null);
      hashingService.hash.mockResolvedValue('hashed');
      (usersRepo.create as jest.Mock).mockReturnValue({} as User);
      (usersRepo.save as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

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
      userService.getUserByEmail.mockResolvedValue({
        id: 'u1',
        email: dto.email,
        password: 'hashed',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      } as unknown as User);
      hashingService.compare.mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(
        MESSAGES.USER_WRONG_PASSWORD,
      );
    });

    it('should return tokens and user on success', async () => {
      const existing = {
        id: 'u1',
        email: dto.email,
        password: 'hashed',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      } as unknown as User;
      userService.getUserByEmail.mockResolvedValue(existing);
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
      expect(redisService.setKey).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.REFRESH_TOKEN}:${existing.id}`,
        'hashed.refresh',
        TTL_CACHE.REFRESH_TOKEN,
      );
      expect(userService.updateRefreshToken).toHaveBeenCalledWith(
        'u1',
        'hashed.refresh',
      );
    });

    it('should use default config values when configService returns null/undefined', async () => {
      const existing = {
        id: 'u1',
        email: dto.email,
        password: 'hashed',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      } as unknown as User;
      userService.getUserByEmail.mockResolvedValue(existing);
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
      const existing = {
        id: 'u1',
        email: dto.email,
        password: 'hashed',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      } as unknown as User;
      userService.getUserByEmail.mockResolvedValue(existing);
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
      const payload = {
        id: mockUuidUser,
        ...mockingUserInfo,
      };
      jwtService.verifyAsync.mockResolvedValue(payload);
      redisService.getKey.mockResolvedValue('cached.hashed.refresh');
      hashingService.compare.mockResolvedValue(true);
      configService.get
        .mockReturnValueOnce('refresh-secret') // JWT_REFRESH_SECRET
        .mockReturnValueOnce('jwt-secret') // JWT_SECRET
        .mockReturnValueOnce('1h'); // JWT_EXPIRES_IN
      jwtService.signAsync.mockResolvedValue('new.access.token');

      const result = await service.refreshTokens('valid.refresh.token');

      expect(result).toEqual({ accessToken: 'new.access.token' });
      expect(redisService.getKey).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.REFRESH_TOKEN}:${mockUuidUser}`,
      );
      expect(userService.getUserById).not.toHaveBeenCalled();
    });

    it('should throw error when cached refresh token is invalid', async () => {
      const payload = {
        id: mockUuidUser,
        ...mockingUserInfo,
      };
      jwtService.verifyAsync.mockResolvedValue(payload);
      redisService.getKey.mockResolvedValue('cached.hashed.refresh');
      hashingService.compare.mockResolvedValue(false);

      await expect(
        service.refreshTokens('invalid.refresh.token'),
      ).rejects.toThrow(MESSAGES.USER_INVALID_REFRESH_TOKEN);
    });

    it('should throw error when user missing or stored token absent', async () => {
      const payload = { id: 'u1' };
      jwtService.verifyAsync.mockResolvedValue(payload);
      redisService.getKey.mockResolvedValue(null);
      userService.getUserById.mockResolvedValue({
        id: 'u1',
        refreshToken: undefined,
      } as User);

      await expect(service.refreshTokens('any.refresh')).rejects.toThrow(
        MESSAGES.USER_INVALID_REFRESH_TOKEN,
      );
    });

    it('should throw error when user not found', async () => {
      const payload = { id: 'u1' };
      jwtService.verifyAsync.mockResolvedValue(payload);
      redisService.getKey.mockResolvedValue(null);
      userService.getUserById.mockResolvedValue(null);

      await expect(service.refreshTokens('any.refresh')).rejects.toThrow(
        MESSAGES.USER_INVALID_REFRESH_TOKEN,
      );
    });

    it('should throw error when stored refresh token mismatches', async () => {
      const payload = { id: 'u1' };
      jwtService.verifyAsync.mockResolvedValue(payload);
      redisService.getKey.mockResolvedValue(null);
      userService.getUserById.mockResolvedValue({
        id: 'u1',
        refreshToken: 'stored.hash',
      } as User);
      hashingService.compare.mockResolvedValue(false);

      await expect(service.refreshTokens('incoming.refresh')).rejects.toThrow(
        MESSAGES.USER_INVALID_REFRESH_TOKEN,
      );
    });

    it('should return new accessToken using DB stored token when cache is missing', async () => {
      const payload = {
        id: mockUuidUser,
        ...mockingUserInfo,
      };
      jwtService.verifyAsync.mockResolvedValue(payload);
      redisService.getKey.mockResolvedValue(null);
      userService.getUserById.mockResolvedValue({
        id: mockUuidUser,
        refreshToken: 'stored.hash',
      } as User);
      hashingService.compare.mockResolvedValue(true);
      configService.get
        .mockReturnValueOnce('refresh-secret') // JWT_REFRESH_SECRET
        .mockReturnValueOnce('jwt-secret') // JWT_SECRET
        .mockReturnValueOnce('1h'); // JWT_EXPIRES_IN
      jwtService.signAsync.mockResolvedValue('new.access.token');

      const result = await service.refreshTokens('incoming.refresh');

      expect(result).toEqual({ accessToken: 'new.access.token' });
      expect(redisService.getKey).toHaveBeenCalledWith(
        `${REDIS_CACHE_KEYS.REFRESH_TOKEN}:${mockUuidUser}`,
      );
      expect(userService.getUserById).toHaveBeenCalledWith(mockUuidUser);
      expect(hashingService.compare).toHaveBeenCalledWith(
        'incoming.refresh',
        'stored.hash',
      );
      expect(jwtService.signAsync).toHaveBeenCalled();
    });

    it('should use default config values when refreshing tokens with null config', async () => {
      const payload = {
        id: mockUuidUser,
        ...mockingUserInfo,
      };
      jwtService.verifyAsync.mockResolvedValue(payload);
      redisService.getKey.mockResolvedValue(null);
      userService.getUserById.mockResolvedValue({
        id: mockUuidUser,
        refreshToken: 'stored.hash',
      } as User);
      hashingService.compare.mockResolvedValue(true);
      configService.get.mockReturnValue(null);
      jwtService.signAsync.mockResolvedValue('new.access.token');

      const result = await service.refreshTokens('incoming.refresh');

      expect(result).toEqual({ accessToken: 'new.access.token' });
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        payload,
        expect.objectContaining({
          secret: 'default-secret',
          expiresIn: '1h',
        }),
      );
    });

    it('should handle errors during token refresh', async () => {
      const payload = {
        id: mockUuidUser,
        ...mockingUserInfo,
      };
      jwtService.verifyAsync.mockResolvedValue(payload);
      redisService.getKey.mockResolvedValue(null);
      userService.getUserById.mockResolvedValue({
        id: mockUuidUser,
        refreshToken: 'stored.hash',
      } as User);
      hashingService.compare.mockResolvedValue(true);
      configService.get.mockReturnValue('secret');
      jwtService.signAsync.mockRejectedValue(new Error('Sign error'));

      await expect(service.refreshTokens('incoming.refresh')).rejects.toThrow();
    });
  });
});
