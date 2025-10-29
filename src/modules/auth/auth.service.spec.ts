// Libs
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// App sources
import { CUSTOM_PROVIDER_TOKENS } from '@app/shared/common';
import { MESSAGES } from '@app/shared/constants';
import { UserRole, UserStatus } from '@app/shared/types';
import { AppLoggerService } from '@app/modules/logger/logger.service';
import { UserService } from '@app/modules/users/users.service';
import { User } from '@app/modules/users/entities';

// Local sources
import { AuthService } from './auth.service';
import { LoginRequestDto, RegisterRequestDto } from './dto';
import {
  mockingUserInfo,
  mockingUserLogin,
  mockingUserRegister,
  mockUuidUser,
} from '@app/shared/mocks/mockingUserData.mock';

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
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

    service = module.get<AuthService>(AuthService);
    usersRepo = module.get(getRepositoryToken(User));
    hashingService = module.get(
      CUSTOM_PROVIDER_TOKENS.PASSWORD_HASHING_SERVICE,
    );
    configService = module.get(ConfigService);
    jwtService = module.get(JwtService);
    userService = module.get(UserService);
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
      const created = { email: dto.email } as Partial<User>;
      const saved = {
        id: 'uuid-1234',
        email: dto.email,
        role: dto.role,
        status: dto.status,
      } as User;
      (usersRepo.create as jest.Mock).mockReturnValue(created);
      (usersRepo.save as jest.Mock).mockResolvedValue(saved);

      const result = await service.register(dto);

      expect(result).toEqual({
        id: saved.id,
        email: saved.email,
        role: saved.role,
        status: saved.status,
      });
      expect(hashingService.hash).toHaveBeenCalledWith(dto.password);
      expect(usersRepo.create).toHaveBeenCalled();
      expect(usersRepo.save).toHaveBeenCalled();
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
      configService.get
        .mockReturnValueOnce('jwt-secret') // JWT_SECRET
        .mockReturnValueOnce('1h') // JWT_EXPIRES_IN
        .mockReturnValueOnce('refresh-secret') // JWT_REFRESH_SECRET
        .mockReturnValueOnce('7d'); // JWT_REFRESH_EXPIRES_IN
      jwtService.signAsync
        .mockResolvedValueOnce('access.token')
        .mockResolvedValueOnce('refresh.token');
      hashingService.hash.mockResolvedValue('hashed.refresh');

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
      expect(userService.updateRefreshToken).toHaveBeenCalledWith(
        'u1',
        'hashed.refresh',
      );
    });
  });

  describe('refreshTokens', () => {
    it('should throw error when user missing or stored token absent', async () => {
      jwtService.verifyAsync.mockResolvedValue({ id: 'u1' });
      userService.getUserById.mockResolvedValue({
        id: 'u1',
        refreshToken: undefined,
      } as User);

      await expect(service.refreshTokens('any.refresh')).rejects.toThrow(
        MESSAGES.USER_INVALID_REFRESH_TOKEN,
      );
    });

    it('should throw error when stored refresh token mismatches', async () => {
      jwtService.verifyAsync.mockResolvedValue({ id: 'u1' });
      userService.getUserById.mockResolvedValue({
        id: 'u1',
        refreshToken: 'stored.hash',
      } as User);
      hashingService.compare.mockResolvedValue(false);

      await expect(service.refreshTokens('incoming.refresh')).rejects.toThrow(
        MESSAGES.USER_INVALID_REFRESH_TOKEN,
      );
    });

    it('should return new accessToken on success', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        id: mockUuidUser,
        ...mockingUserInfo,
      });
      userService.getUserById.mockResolvedValue({
        id: mockUuidUser,
        refreshToken: 'stored.hash',
      } as User);
      hashingService.compare.mockResolvedValue(true);
      configService.get
        .mockReturnValueOnce('jwt-secret') // JWT_SECRET
        .mockReturnValueOnce('1h'); // JWT_EXPIRES_IN
      jwtService.signAsync.mockResolvedValue('new.access.token');

      const result = await service.refreshTokens('incoming.refresh');
      expect(result).toEqual({ accessToken: 'new.access.token' });
      expect(jwtService.signAsync).toHaveBeenCalled();
    });
  });
});
