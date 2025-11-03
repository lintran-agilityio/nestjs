// libs
import { INestApplication, HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import type { Server } from 'http';

// Apis
import { AuthController } from '@app/apis/auth/auth.controller';
import { AuthService } from '@app/apis/auth/auth.service';
import { RegisterRequestDto, RegisterResponseDto } from '@app/apis/auth/dto';

// App source
import { configureApp, url } from '@e2e/helpers/app';
import {
  mockingUserInfo,
  mockingUserRegister,
  mockUuidUser,
} from '@app/shared/mocks';
import { MockHandleErrorArgs } from '@app/shared/interfaces';

// Silence error.utils throwing in validation factory if used
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

describe('Auth - Register (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  const REGISTER_PATH = 'auth/register';

  const mockAuthService = {
    register: jest.fn<Promise<RegisterResponseDto>, [RegisterRequestDto]>(),
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

  it('POST /api/v1/auth/register -> 201 and returns created user info', async () => {
    const payload: RegisterRequestDto = mockingUserRegister;

    const mockResponse: RegisterResponseDto = {
      id: mockUuidUser,
      ...mockingUserInfo,
    } as RegisterResponseDto;

    mockAuthService.register.mockResolvedValueOnce(mockResponse);

    const res = await request(server)
      .post(url(REGISTER_PATH))
      .send(payload)
      .expect(HttpStatus.CREATED);

    expect(res.body).toEqual(mockResponse);
    expect(mockAuthService.register).toHaveBeenCalledTimes(1);
    expect(mockAuthService.register).toHaveBeenCalledWith(
      expect.objectContaining(payload),
    );
  });

  it('POST /api/v1/auth/register -> 400 on invalid body', async () => {
    // missing required fields and invalid email/password format
    await request(server)
      .post(url(REGISTER_PATH))
      .send({ email: 'abcb.c' })
      .expect(HttpStatus.BAD_REQUEST);
  });
});
