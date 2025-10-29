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
import { MESSAGES } from '../constants';
import { IJwtPayload } from '../types';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepo: Repository<User>;
  let configService: ConfigService;

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
      const payload: IJwtPayload = {
        sub: 'user-123',
        id: 'user-123',
        email: 'test@example.com',
        role: 'USER' as any,
      };
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'USER',
        status: 'ACTIVE',
        firstName: 'John',
        lastName: 'Doe',
      };

      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: ['id', 'email', 'role', 'status', 'firstName', 'lastName'],
      });
      expect(result).toEqual(mockUser);
    });

    it('returns user when payload contains sub instead of id', async () => {
      const payload: any = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'USER',
        status: 'ACTIVE',
      };
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'USER',
        status: 'ACTIVE',
        firstName: 'John',
        lastName: 'Doe',
      };

      (userRepo.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: ['id', 'email', 'role', 'status', 'firstName', 'lastName'],
      });
      expect(result).toEqual(mockUser);
    });

    it('throws UnauthorizedException when payload has neither id nor sub', async () => {
      const payload: any = {
        email: 'test@example.com',
      };

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(userRepo.findOne).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when user is not found', async () => {
      const payload: IJwtPayload = {
        sub: 'user-123',
        id: 'user-123',
        email: 'test@example.com',
        role: 'USER' as any,
      };

      (userRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('handles errors and throws UnauthorizedException', async () => {
      const payload: IJwtPayload = {
        sub: 'user-123',
        id: 'user-123',
        email: 'test@example.com',
        role: 'USER' as any,
      };

      (userRepo.findOne as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('preserves UnauthorizedException when already thrown', async () => {
      const payload: IJwtPayload = {
        sub: 'user-123',
        id: 'user-123',
        email: 'test@example.com',
        role: 'USER' as any,
      };

      const unauthorizedError = new UnauthorizedException('Custom message');
      (userRepo.findOne as jest.Mock).mockRejectedValue(unauthorizedError);

      await expect(strategy.validate(payload)).rejects.toThrow(unauthorizedError);
    });
  });
});

