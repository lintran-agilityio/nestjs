// libs
import {
  INestApplication,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import type { Server } from 'http';

// App modules
import { UserController } from '@app/apis/users/users.controller';
import { UserService } from '@app/apis/users/users.service';
import { User } from '@app/apis/users/entities';
import { UserResponseDto } from '@app/apis/users/dtos';

// Apis
import { MetadataResponseDto, QueryPaginationParamDto } from '@app/shared/dtos';
import { JwtAuthGuard, RolesGuard, OwnUserGuard } from '@app/shared/guards';
import { configureApp, url } from '@e2e/helpers/app';
import {
  createMockJwtGuard,
  createMockRolesGuard,
  createMockOwnershipGuard,
} from '@e2e/helpers/guards';
import { MockHandleErrorArgs } from '@app/shared/interfaces';
import {
  mockingMetadata,
  mockingUser,
  mockingUserInfo,
  mockUuidUser,
} from '@app/shared/mocks';
import { OrderBy } from '@app/shared/types';
import { PATHS } from '@app/shared/constants';

// Silence error.utils throwing in validation if used by decorators
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

describe('Users - Modules (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  const USERS_PATH = PATHS.USERS;

  const mockUserService: {
    getUsersRecently: jest.MockedFunction<UserService['getUsersRecently']>;
    getById: jest.MockedFunction<UserService['getById']>;
    getByEmail: jest.MockedFunction<UserService['getByEmail']>;
    getByIdOrEmail: jest.MockedFunction<UserService['getByIdOrEmail']>;
    updateAll: jest.MockedFunction<UserService['updateAll']>;
    updateById: jest.MockedFunction<UserService['updateById']>;
    deleteAll: jest.MockedFunction<UserService['deleteAll']>;
    deleteById: jest.MockedFunction<UserService['deleteById']>;
    deletePostById: jest.MockedFunction<UserService['deletePostById']>;
  } = {
    getUsersRecently: jest.fn<Promise<UserResponseDto>, [QueryPaginationParamDto]>(),
    getById: jest.fn(),
    getByEmail: jest.fn(),
    getByIdOrEmail: jest.fn(),
    updateAll: jest.fn(),
    updateById: jest.fn(),
    deleteAll: jest.fn(),
    deleteById: jest.fn(),
    deletePostById: jest.fn(),
  };

  const mockUsers: User[] = [mockingUser];

  const mockMeta: MetadataResponseDto = mockingMetadata;

  const mockResponse: UserResponseDto = {
    data: mockUsers,
    meta: mockMeta,
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(createMockJwtGuard())
      .overrideGuard(RolesGuard)
      .useValue(createMockRolesGuard())
      .overrideGuard(OwnUserGuard)
      .useValue(createMockOwnershipGuard())
      .compile();

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

  describe('GET /api/v1/users', () => {
    it('should return 200 with paginated users', async () => {
      mockUserService.getUsersRecently.mockResolvedValueOnce(mockResponse);
      const queryParam = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        orderBy: OrderBy.ASC,
      };

      const res = await request(server)
        .get(url(USERS_PATH))
        .query(queryParam)
        .expect(HttpStatus.OK);

      type UsersListResponse = { data: User[]; meta: MetadataResponseDto };
      const body = res.body as unknown as UsersListResponse;

      expect(Array.isArray(body.data)).toBe(true);
      expect(body.meta).toBeDefined();
      expect(body.data.length).toBe(1);
      expect(body.meta).toEqual(mockMeta);
      expect(mockUserService.getUsersRecently).toHaveBeenCalledTimes(1);
      expect(mockUserService.getUsersRecently).toHaveBeenCalledWith(
        expect.objectContaining(queryParam),
      );
    });

    it('should return 400 when query has invalid types', async () => {
      await request(server)
        .get(url(USERS_PATH))
        .query({ page: 'zero', limit: -1 })
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockUserService.getUsersRecently).not.toHaveBeenCalled();
    });

    it('should return 400 when query has extra properties', async () => {
      await request(server)
        .get(url(USERS_PATH))
        .query({ page: 1, limit: 10, extra: 'not-allowed' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockUserService.getUsersRecently).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return 200 with user when id is valid UUID', async () => {
      const id = mockUuidUser;
      mockUserService.getByIdOrEmail.mockResolvedValueOnce(mockingUser);

      const res = await request(server)
        .get(url(`${USERS_PATH}/${id}`))
        .expect(HttpStatus.OK);

      const body = res.body as User;
      expect(body).toBeDefined();
      expect(body.id).toBe(id);
      expect(mockUserService.getByIdOrEmail).toHaveBeenCalledTimes(1);
      expect(mockUserService.getByIdOrEmail.mock.calls[0][0]).toBe(id);
    });

    it('should return 400 when id is not a valid UUID', async () => {
      mockUserService.getByIdOrEmail.mockImplementationOnce(() => {
        throw new BadRequestException();
      });

      await request(server)
        .get(url(`${USERS_PATH}/not-a-uuid`))
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockUserService.getByIdOrEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/v1/users/:email', () => {
    it('should return 400 for unsupported email format via unified identifier route', async () => {
      mockUserService.getByIdOrEmail.mockImplementationOnce(() => {
        throw new BadRequestException();
      });

      await request(server)
        .get(url(`${USERS_PATH}/${mockingUserInfo.email}`))
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockUserService.getByIdOrEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('PATCH - Update user by id with USERS_PATH: /api/v1/users/:id', () => {
    it('should return 200 and call updateById with payload', async () => {
      const id = mockUuidUser;
      const payload = { firstName: 'Johnny' } as Partial<User>;
      const updatedUser = { ...mockingUser, ...payload, id } as User;
      mockUserService.updateById.mockResolvedValueOnce(updatedUser);

      const res = await request(server)
        .patch(url(`${USERS_PATH}/${id}`))
        .send(payload)
        .expect(HttpStatus.OK);

      expect(res.body).toEqual(expect.objectContaining(payload));
      expect(mockUserService.updateById).toHaveBeenCalledTimes(1);
      expect(mockUserService.updateById).toHaveBeenCalledWith(
        id,
        expect.objectContaining(payload),
      );
    });

    it('should return 400 when id is not UUID', async () => {
      await request(server)
        .patch(url(`${USERS_PATH}/not-a-uuid`))
        .send({ firstName: 'Johnny' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockUserService.updateById).not.toHaveBeenCalled();
    });

    it('should return 400 when body has extra properties', async () => {
      await request(server)
        .patch(url(`${USERS_PATH}/${mockUuidUser}`))
        .send({ firstName: 'Johnny', unknown: 'field' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockUserService.updateById).not.toHaveBeenCalled();
    });
  });

  describe('PUT - Update all users with USERS_PATH: /api/v1/users', () => {
    const UPDATE_ALL_USERS_PATH = USERS_PATH;

    it('should return 200 and list of users updated', async () => {
      const payload = {
        users: [
          {
            id: mockUuidUser,
            firstName: 'Johnny',
          },
        ],
      };
      mockUserService.updateAll.mockResolvedValueOnce([mockingUser]);

      const res = await request(server)
        .put(url(UPDATE_ALL_USERS_PATH))
        .set('Content-Type', 'application/json')
        .send(payload)
        .expect(HttpStatus.OK);

      const body = res.body as User[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(1);
      expect(mockUserService.updateAll).toHaveBeenCalledTimes(1);
      expect(mockUserService.updateAll).toHaveBeenCalledWith(
        expect.objectContaining(payload),
      );
    });

    it('should return 400 when users array is missing', async () => {
      await request(server)
        .put(url(UPDATE_ALL_USERS_PATH))
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockUserService.updateAll).not.toHaveBeenCalled();
    });

    it('should return 400 when user item missing id', async () => {
      const payload = { users: [{ firstName: 'NoId' }] };
      await request(server)
        .put(url(UPDATE_ALL_USERS_PATH))
        .send(payload)
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockUserService.updateAll).not.toHaveBeenCalled();
    });
  });

  describe('DELETE - Delete all users with USERS_PATH: /api/v1/users', () => {
    it('should return 204 and call deleteAll', async () => {
      const responseBody = {
        message: 'Deleted 1 users successfully.',
        count: 1,
      };
      mockUserService.deleteAll.mockResolvedValueOnce(responseBody);

      await request(server)
        .delete(url(USERS_PATH))
        .expect(HttpStatus.NO_CONTENT);

      expect(mockUserService.deleteAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('DELETE - Delete user by id with USERS_PATH: /api/v1/users/:id', () => {
    it('should return 204 when id is valid UUID', async () => {
      const id = mockUuidUser;
      mockUserService.deleteById.mockResolvedValueOnce();

      await request(server)
        .delete(url(`${USERS_PATH}/${id}`))
        .expect(HttpStatus.NO_CONTENT);

      expect(mockUserService.deleteById).toHaveBeenCalledTimes(1);
      expect(mockUserService.deleteById).toHaveBeenCalledWith(id);
    });

    it('should return 400 when id is not UUID', async () => {
      await request(server)
        .delete(url(`${USERS_PATH}/not-a-uuid`))
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockUserService.deleteById).not.toHaveBeenCalled();
    });
  });

  describe("DELETE - Delete user's post by id with USERS_PATH: /api/v1/users/:id/posts/:postId", () => {
    const postId = '22222222-2222-2222-2222-222222222222';

    it('should return 204 when both ids are valid UUID', async () => {
      const id = mockUuidUser;
      mockUserService.deletePostById.mockResolvedValueOnce();

      await request(server)
        .delete(url(`${USERS_PATH}/${id}/posts/${postId}`))
        .expect(HttpStatus.NO_CONTENT);

      expect(mockUserService.deletePostById).toHaveBeenCalledTimes(1);
      expect(mockUserService.deletePostById).toHaveBeenCalledWith(id, postId);
    });

    it('should return 400 when user id is not UUID', async () => {
      await request(server)
        .delete(url(`${USERS_PATH}/not-a-uuid/posts/${postId}`))
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockUserService.deletePostById).not.toHaveBeenCalled();
    });

    it('should return 400 when post id is not UUID', async () => {
      await request(server)
        .delete(url(`${USERS_PATH}/${mockUuidUser}/posts/not-a-uuid`))
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockUserService.deletePostById).not.toHaveBeenCalled();
    });
  });
});
