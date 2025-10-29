// Libs
import { Test, TestingModule } from '@nestjs/testing';

// App sources
import { UserRole, UserStatus } from '@app/shared/types';

// Local sources
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginRequestDto, RegisterRequestDto } from './dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    register: jest.Mock;
    login: jest.Mock;
    refreshTokens: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshTokens: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call service and return result', async () => {
      const dto: RegisterRequestDto = new RegisterRequestDto({
        email: 'john.doe@example.com',
        password: 'Password@123',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      });
      const expected = {
        id: 'uuid-1',
        email: dto.email,
        role: dto.role,
        status: dto.status,
      };
      authService.register.mockResolvedValue(expected);

      const result = await controller.register(dto);
      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('login', () => {
    it('should call service and return result', async () => {
      const dto: LoginRequestDto = new LoginRequestDto({
        email: 'john.doe@example.com',
        password: 'Password@123',
      });
      const expected = {
        accessToken: 'access',
        refreshToken: 'refresh',
        user: { id: 'u1', email: dto.email, role: UserRole.USER, status: UserStatus.ACTIVE },
      };
      authService.login.mockResolvedValue(expected);

      const result = await controller.login(dto);
      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expected);
    });
  });

  describe('refresh', () => {
    it('should call service and return access token', async () => {
      authService.refreshTokens.mockResolvedValue({ accessToken: 'new.access' });
      const result = await controller.refresh('refresh.token');
      expect(authService.refreshTokens).toHaveBeenCalledWith('refresh.token');
      expect(result).toEqual({ accessToken: 'new.access' });
    });
  });
});
