// Libs
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Local sources
import { OwnUserGuard } from './own-user.guard';
import { UserRole } from '../types';

describe('OwnUserGuard', () => {
  let guard: OwnUserGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OwnUserGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<OwnUserGuard>(OwnUserGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    const createMockContext = (request): ExecutionContext => {
      return {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(request),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;
    };

    it('throws ForbiddenException when user is not present', () => {
      const mockRequest = {};
      const context = createMockContext(mockRequest);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('allows access when user is ADMIN', () => {
      const mockRequest = {
        user: { id: 'admin-id', role: UserRole.ADMIN },
        params: { id: 'user-id' },
      };
      const context = createMockContext(mockRequest);
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('allows access when USER role matches params.id', () => {
      const userId = 'user-123';
      const mockRequest = {
        user: { id: userId, role: UserRole.USER },
        params: { id: userId },
      };
      const context = createMockContext(mockRequest);
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('throws ForbiddenException when USER role does not match params.id', () => {
      const mockRequest = {
        user: { id: 'user-123', role: UserRole.USER },
        params: { id: 'different-user-id' },
      };
      const context = createMockContext(mockRequest);
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('uses ownershipField from metadata when provided', () => {
      const userId = 'user-123';
      const mockRequest = {
        user: { id: userId, role: UserRole.USER },
        body: { userId },
        params: {},
      };
      const context = createMockContext(mockRequest);
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue('userId');

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        'ownershipField',
        [context.getHandler(), context.getClass()],
      );
    });

    it('falls back to params when ownershipField not in body', () => {
      const userId = 'user-123';
      const mockRequest = {
        user: { id: userId, role: UserRole.USER },
        body: {},
        params: { userId },
      };
      const context = createMockContext(mockRequest);
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue('userId');

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('throws ForbiddenException when targetId is not found', () => {
      const mockRequest = {
        user: { id: 'user-123', role: UserRole.USER },
        body: {},
        params: {},
      };
      const context = createMockContext(mockRequest);
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when ownershipField specified but not found', () => {
      const mockRequest = {
        user: { id: 'user-123', role: UserRole.USER },
        body: {},
        params: {},
      };
      const context = createMockContext(mockRequest);
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue('postId');

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
