// Libs
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { firstValueFrom } from 'rxjs';

// Local sources
import { JwtAuthGuard } from './jwt.guard';
import { IS_PUBLIC_KEY } from '../common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    beforeEach(() => {
      // Reset environment
      delete process.env.NODE_ENV;
      delete process.env.JEST_WORKER_ID;
    });

    it('returns true in test environment', async () => {
      process.env.NODE_ENV = 'test';

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).not.toHaveBeenCalled();
    });

    it('returns true when JEST_WORKER_ID is set', async () => {
      process.env.JEST_WORKER_ID = '1';

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('returns true when route is public', async () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });

    it('calls super.canActivate when route is not public', async () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);

      // Access the parent class prototype and spy on it
      const AuthGuardPrototype = Object.getPrototypeOf(JwtAuthGuard.prototype);
      const parentCanActivate = jest
        .spyOn(AuthGuardPrototype, 'canActivate')
        .mockResolvedValue(true);

      const result = await guard.canActivate(mockContext);

      expect(parentCanActivate).toHaveBeenCalled();
      expect(result).toBe(true);
      parentCanActivate.mockRestore();
    });

    it('handles Promise result from super.canActivate', async () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
      const AuthGuardPrototype = Object.getPrototypeOf(JwtAuthGuard.prototype);
      const parentCanActivate = jest
        .spyOn(AuthGuardPrototype, 'canActivate')
        .mockResolvedValue(Promise.resolve(true));

      const result = await guard.canActivate(mockContext);

      expect(result).toBeDefined();
      parentCanActivate.mockRestore();
    });

    it('handles Observable result from super.canActivate', async () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
      const { of } = require('rxjs');
      const AuthGuardPrototype = Object.getPrototypeOf(JwtAuthGuard.prototype);
      const parentCanActivate = jest
        .spyOn(AuthGuardPrototype, 'canActivate')
        .mockReturnValue(of(true));

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      parentCanActivate.mockRestore();
    });

    it('handles boolean result from super.canActivate', async () => {
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
      const AuthGuardPrototype = Object.getPrototypeOf(JwtAuthGuard.prototype);
      const parentCanActivate = jest
        .spyOn(AuthGuardPrototype, 'canActivate')
        .mockReturnValue(true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      parentCanActivate.mockRestore();
    });
  });
});
