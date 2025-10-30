// Libs
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// App sources
import { User } from '@app/modules/users/entities';

// Local sources
import { JwtStrategy } from './jwt.strategy';
import { IJwtPayload, UserRole } from '../types';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepo: Repository<User>;
  let configService: ConfigService;

  // Default test data
  const defaultUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'USER',
    status: 'ACTIVE',
    firstName: 'John',
    lastName: 'Doe',
  };

  const defaultPayload: IJwtPayload = {
    sub: 'user-123',
    id: 'user-123',
    email: 'test@example.com',
    role: 'USER',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('returns user when payload contains id and user exists', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(defaultUser);

      const result = await strategy.validate(defaultPayload);

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: ['id', 'email', 'role', 'status', 'firstName', 'lastName'],
      });
      expect(result).toEqual(defaultUser);
    });

    it('returns user when payload contains sub instead of id', async () => {
      const payload = {
        sub: 'user-123',
        email: defaultUser.email,
        role: UserRole.USER,
      };

      (userRepo.findOne as jest.Mock).mockResolvedValue(defaultUser);

      const result = await strategy.validate(payload);

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: ['id', 'email', 'role', 'status', 'firstName', 'lastName'],
      });
      expect(result).toEqual(defaultUser);
    });

    it('throws UnauthorizedException when payload has neither id nor sub', async () => {
      const payload = {
        email: defaultUser.email,
        role: UserRole.USER,
        sub: 'user-123',
      };

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(userRepo.findOne).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when user is not found', async () => {
      (userRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(strategy.validate(defaultPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('handles errors and throws UnauthorizedException', async () => {
      (userRepo.findOne as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(strategy.validate(defaultPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('preserves UnauthorizedException when already thrown', async () => {
      const unauthorizedError = new UnauthorizedException('Custom message');
      (userRepo.findOne as jest.Mock).mockRejectedValue(unauthorizedError);

      await expect(strategy.validate(defaultPayload)).rejects.toThrow(
        unauthorizedError,
      );
    });
  });
});
