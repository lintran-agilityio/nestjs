// Libs
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Local sources
import { RolesGuard } from './roles-guard.guard';
import { UserRole } from '../types';
import { ROLES_KEY } from '../common/keys';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    const createMockContext = (user: any): ExecutionContext => {
      return {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({ user }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;
    };

    it('allows access when no roles are specified', () => {
      const mockUser = { id: 'user-123', role: UserRole.USER };
      const context = createMockContext(mockUser);
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(null);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('allows access when empty roles array is specified', () => {
      const mockUser = { id: 'user-123', role: UserRole.USER };
      const context = createMockContext(mockUser);
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('allows access when user role matches required role', () => {
      const mockUser = { id: 'admin-123', role: UserRole.ADMIN };
      const context = createMockContext(mockUser);
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserRole.ADMIN,
      ]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('allows access when user role matches one of required roles', () => {
      const mockUser = { id: 'user-123', role: UserRole.USER };
      const context = createMockContext(mockUser);
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserRole.ADMIN,
        UserRole.USER,
      ]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('throws ForbiddenException when user is not present', () => {
      const context = createMockContext(undefined);
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserRole.ADMIN,
      ]);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when user role does not match required roles', () => {
      const mockUser = { id: 'user-123', role: UserRole.USER };
      const context = createMockContext(mockUser);
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
        UserRole.ADMIN,
      ]);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});

