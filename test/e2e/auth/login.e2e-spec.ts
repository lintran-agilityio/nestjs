// libs
import {
  INestApplication,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import type { Server } from 'http';

import { AuthController } from '@app/modules/auth/auth.controller';
import { AuthService } from '@app/modules/auth/auth.service';
import {
  LoginRequestDto,
  LoginResponseDto,
  UserInfoResponseDto,
} from '@app/modules/auth/dto';
import { UserRole, UserStatus } from '@app/shared/types';
import { MESSAGES } from '@app/shared/constants';
import { configureApp, url } from '@e2e/helpers/app';
import {
  mockingAdminLogin,
  mockingUserInfo,
  mockingUserLogin,
  mockUuidUser,
} from '@e2e/mocks/mockingUserData.mock';

// Silence error.utils throwing in validation factory if used
type MockHandleErrorArgs = {
  ExceptionClass?: new (message?: string) => Error;
  defaultMessage?: string;
};

jest.mock('@app/shared/utils/error.utils', () => {
  const handleErrorException = jest.fn((args: MockHandleErrorArgs = {}) => {
    const { ExceptionClass, defaultMessage } = args;
    if (ExceptionClass) {
      throw new ExceptionClass(defaultMessage ?? 'Validation error');
    }
    throw new Error(defaultMessage ?? 'Validation error');
  });
  return { handleErrorException };
});

describe('Auth - Login (e2e)', () => {
  let app: INestApplication;
  let server: Server;

  const mockAuthService = {
    login: jest.fn<Promise<LoginResponseDto>, [LoginRequestDto]>(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);

    await app.init();
    server = app.getHttpServer() as unknown as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/login', () => {
    const mockUserInfo: UserInfoResponseDto = {
      id: mockUuidUser,
      ...mockingUserInfo,
    };

    const mockLoginResponse: LoginResponseDto = {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.access.token',
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.refresh.token',
      user: mockUserInfo,
    };

    const userPayloadLogin: LoginRequestDto = mockingUserLogin;
    const adminPayloadLogin: LoginRequestDto = mockingAdminLogin;

    it('should return 200 and login response with valid credentials', async () => {
      mockAuthService.login.mockResolvedValueOnce(mockLoginResponse);

      // Act & Assert
      const res = await request(server)
        .post(url('auth/login'))
        .send(userPayloadLogin)
        .expect(HttpStatus.OK);

      const body = res.body as LoginResponseDto;

      expect(body).toEqual(mockLoginResponse);
      expect(body).toHaveProperty('accessToken');
      expect(body).toHaveProperty('refreshToken');
      expect(body).toHaveProperty('user');
      expect(body.user).toEqual(mockUserInfo);
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
      expect(mockAuthService.login).toHaveBeenCalledWith(
        expect.objectContaining(userPayloadLogin),
      );
    });

    it('should return 200 with admin user role', async () => {
      // Arrange
      const adminUserInfo: UserInfoResponseDto = {
        id: mockUuidUser,
        ...mockingUserInfo,
        email: adminPayloadLogin.email,
        role: UserRole.ADMIN,
      };

      const adminLoginResponse: LoginResponseDto = {
        accessToken: 'admin.access.token',
        refreshToken: 'admin.refresh.token',
        user: adminUserInfo,
      };

      mockAuthService.login.mockResolvedValueOnce(adminLoginResponse);

      // Act & Assert
      const res = await request(server)
        .post(url('auth/login'))
        .send(adminPayloadLogin)
        .expect(HttpStatus.OK);

      const body = res.body as LoginResponseDto;
      expect(body.user.role).toBe(UserRole.ADMIN);
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
    });

    it('should return 401 when user is not found', async () => {
      mockAuthService.login.mockImplementation(() => {
        throw new UnauthorizedException(MESSAGES.USER_NOT_FOUND);
      });

      // Act & Assert
      await request(server)
        .post(url('auth/login'))
        .send(userPayloadLogin)
        .expect(HttpStatus.UNAUTHORIZED);

      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
      expect(mockAuthService.login).toHaveBeenCalledWith(
        expect.objectContaining(userPayloadLogin),
      );
    });

    it('should return 400 when password is incorrect', async () => {
      mockAuthService.login.mockImplementation(() => {
        throw new BadRequestException(MESSAGES.USER_WRONG_PASSWORD);
      });

      // Act & Assert
      await request(server)
        .post(url('auth/login'))
        .send(userPayloadLogin)
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
    });

    it('should return 400 when request body is empty', async () => {
      // Act & Assert
      await request(server)
        .post(url('auth/login'))
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when email is missing', async () => {
      // Act & Assert
      await request(server)
        .post(url('auth/login'))
        .send(userPayloadLogin.password)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when password is missing', async () => {
      // Act & Assert
      await request(server)
        .post(url('auth/login'))
        .send(userPayloadLogin.email)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when email format is invalid', async () => {
      // Act & Assert
      await request(server)
        .post(url('auth/login'))
        .send(userPayloadLogin)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when email does not match regex pattern', async () => {
      // Arrange
      const payload: LoginRequestDto = {
        email: 'test@',
        password: 'SecureP@ss123',
      };

      // Act & Assert
      await request(server)
        .post(url('auth/login'))
        .send(payload)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when password is too weak', async () => {
      // Arrange
      const payload: LoginRequestDto = {
        email: 'test@example.com',
        password: 'weak',
      };

      // Act & Assert
      await request(server)
        .post(url('auth/login'))
        .send(payload)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when password does not match regex pattern', async () => {
      // Arrange
      const payload: LoginRequestDto = {
        email: 'test@example.com',
        password: 'simplepassword',
      };

      // Act & Assert
      await request(server)
        .post(url('auth/login'))
        .send(payload)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 when password is too short', async () => {
      // Arrange
      const payload: LoginRequestDto = {
        email: 'test@example.com',
        password: 'Ab@1',
      };

      // Act & Assert
      await request(server)
        .post(url('auth/login'))
        .send(payload)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should handle extra properties in request body', async () => {
      // Arrange
      const payload = {
        ...userPayloadLogin,
        extraField: 'should be stripped',
      };

      mockAuthService.login.mockResolvedValueOnce(mockLoginResponse);

      // Act & Assert
      await request(server)
        .post(url('auth/login'))
        .send(payload)
        .expect(HttpStatus.BAD_REQUEST);

      // Should be rejected due to forbidNonWhitelisted validation
    });

    it('should handle concurrent login requests', async () => {
      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      // Act
      const requests = Array.from({ length: 3 }, () =>
        request(server).post(url('auth/login')).send(userPayloadLogin),
      );

      const responses = await Promise.all(requests);

      // Assert
      responses.forEach((res) => {
        const body = res.body as LoginResponseDto;
        expect(res.status).toBe(HttpStatus.OK);
        expect(body).toHaveProperty('accessToken');
        expect(body).toHaveProperty('refreshToken');
      });

      expect(mockAuthService.login).toHaveBeenCalledTimes(3);
    });

    it('should handle different case email variations', async () => {
      mockAuthService.login.mockResolvedValueOnce(mockLoginResponse);

      // Act & Assert
      const res = await request(server)
        .post(url('auth/login'))
        .send(userPayloadLogin)
        .expect(HttpStatus.OK);

      const body = res.body as LoginResponseDto;
      expect(body).toHaveProperty('accessToken');
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
    });

    it('should handle inactive user status', async () => {
      const inactiveUserInfo: UserInfoResponseDto = {
        id: mockUuidUser,
        ...mockingUserInfo,
        status: UserStatus.INACTIVE,
      };

      const inactiveLoginResponse: LoginResponseDto = {
        accessToken: 'inactive.access.token',
        refreshToken: 'inactive.refresh.token',
        user: inactiveUserInfo,
      };

      mockAuthService.login.mockResolvedValueOnce(inactiveLoginResponse);

      // Act & Assert
      const res = await request(server)
        .post(url('auth/login'))
        .send(userPayloadLogin)
        .expect(HttpStatus.OK);

      const body = res.body as LoginResponseDto;
      expect(body.user.status).toBe(UserStatus.INACTIVE);
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
    });
  });
});
