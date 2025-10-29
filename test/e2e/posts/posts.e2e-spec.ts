// libs
import { INestApplication, HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import type { Server } from 'http';

// app modules
import { PostController } from '@app/modules/posts/posts.controller';
import { PostService } from '@app/modules/posts/posts.service';
import { Post, Post as PostEntity } from '@app/modules/posts/entities';
import {
  PostPaginationResponseDto,
  PostRequestDto,
} from '@app/modules/posts/dtos';
import { MetadataResponseDto, QueryPaginationParamDto } from '@app/shared/dtos';
import {
  JwtAuthGuard,
  RolesGuard,
  UserOwnershipProtected,
} from '@app/shared/guards';
import { configureApp, url } from '@e2e/helpers/app';
import { MockHandleErrorArgs } from '@app/shared/interfaces';
import { OrderBy } from '@app/shared/types';
import {
  mockingMetadata,
  mockingPostInfo,
  mockingPostPayload,
  mockingPostUuid,
  mockUuidUser,
} from '@app/shared/mocks';
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

describe('Posts - Modules (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  const POSTS_PATH = PATHS.POSTS;

  const mockPostService: {
    getAll: jest.MockedFunction<PostService['getAll']>;
    getById: jest.MockedFunction<PostService['getById']>;
    create: jest.MockedFunction<PostService['create']>;
    updateById: jest.MockedFunction<PostService['updateById']>;
    deleteById: jest.MockedFunction<PostService['deleteById']>;
    delete: jest.MockedFunction<PostService['delete']>;
  } = {
    getAll: jest.fn<
      Promise<PostPaginationResponseDto>,
      [QueryPaginationParamDto]
    >(),
    getById: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
    delete: jest.fn(),
  };

  const mockPost: PostEntity = Object.assign(new PostEntity(), {
    ...mockingPostInfo,
    createdAt: new Date(mockingPostInfo.createdAt),
    updatedAt: new Date(mockingPostInfo.updatedAt),
    authorId: mockUuidUser,
  } as Partial<PostEntity>);

  const mockPagination: PostPaginationResponseDto =
    new PostPaginationResponseDto({
      data: [mockPost],
      meta: mockingMetadata,
    });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PostController],
      providers: [
        { provide: PostService, useValue: mockPostService },
        // Bypass auth/role guards and ownership guard
        { provide: JwtAuthGuard, useValue: { canActivate: () => true } },
        { provide: RolesGuard, useValue: { canActivate: () => true } },
        {
          provide: UserOwnershipProtected,
          useValue: { canActivate: () => true },
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

  describe('GET /api/v1/posts', () => {
    it('should return 200 with paginated posts', async () => {
      mockPostService.getAll.mockResolvedValueOnce(mockPagination);
      const queryParam = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        orderBy: OrderBy.ASC,
      };

      const res = await request(server)
        .get(url(POSTS_PATH))
        .query(queryParam)
        .expect(HttpStatus.OK);

      type PostListResponse = { data: Post[]; meta: MetadataResponseDto };
      const body = res.body as unknown as PostListResponse;

      expect(Array.isArray(body.data)).toBe(true);
      expect(body.meta).toBeDefined();
      expect(body.data.length).toBe(1);
      expect(body.meta).toEqual(mockingMetadata);
      expect(mockPostService.getAll).toHaveBeenCalledWith(
        expect.objectContaining(queryParam),
      );
    });

    it('should return 400 when query has invalid types', async () => {
      await request(server)
        .get(url(POSTS_PATH))
        .query({ page: 'zero', limit: -1 })
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockPostService.getAll).not.toHaveBeenCalled();
    });

    it('should return 400 when query has extra properties', async () => {
      await request(server)
        .get(url(POSTS_PATH))
        .query({ page: 1, limit: 10, extra: 'x' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockPostService.getAll).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/posts/:id', () => {
    it('should return 200 with post when id is valid UUID', async () => {
      mockPostService.getById.mockResolvedValueOnce(mockPost);

      const res = await request(server)
        .get(url(`${POSTS_PATH}/${mockingPostUuid}`))
        .expect(HttpStatus.OK);

      expect(res.body).toEqual(
        expect.objectContaining({ id: mockingPostUuid }),
      );
      expect(mockPostService.getById).toHaveBeenCalledWith(mockingPostUuid);
    });

    it('should return 400 when id is not a UUID', async () => {
      await request(server)
        .get(url(`${POSTS_PATH}/not-a-uuid`))
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockPostService.getById).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/posts', () => {
    it('should return 201 and created post', async () => {
      mockPostService.create.mockResolvedValueOnce(mockPost);

      const res = await request(server)
        .post(url(POSTS_PATH))
        .send(mockingPostPayload)
        .expect(HttpStatus.CREATED);

      expect(res.body).toEqual(
        expect.objectContaining({ slug: mockingPostPayload.slug }),
      );
      expect(mockPostService.create).toHaveBeenCalledTimes(1);
      // first arg is userId from decorator; we skip strict match and check second arg only
      expect(mockPostService.create.mock.calls[0][1]).toEqual(
        expect.objectContaining(mockingPostPayload),
      );
    });

    it('should return 400 when body invalid', async () => {
      await request(server)
        .post(url(POSTS_PATH))
        .send({ slug: 'ok', title: 't', contents: '' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockPostService.create).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /api/v1/posts/:id', () => {
    const updatePayload: PostRequestDto = {
      slug: mockingPostPayload.slug,
      title: 'Updated title',
      contents: 'Updated contents',
    };

    it('should return 200 and updated post', async () => {
      const updated = { ...mockPost, ...updatePayload } as PostEntity;
      mockPostService.updateById.mockResolvedValueOnce(updated);

      const res = await request(server)
        .patch(url(`${POSTS_PATH}/${mockingPostUuid}`))
        .send(updatePayload)
        .expect(HttpStatus.OK);

      expect(res.body).toEqual(
        expect.objectContaining({ title: updatePayload.title }),
      );
      expect(mockPostService.updateById).toHaveBeenCalledWith(
        mockingPostUuid,
        expect.objectContaining(updatePayload),
      );
    });

    it('should return 400 when id is not UUID', async () => {
      await request(server)
        .patch(url(`${POSTS_PATH}/not-a-uuid`))
        .send(updatePayload)
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockPostService.updateById).not.toHaveBeenCalled();
    });

    it('should return 400 when body has extra field', async () => {
      await request(server)
        .patch(url(`${POSTS_PATH}/${mockingPostUuid}`))
        .send({ ...updatePayload, extra: 'x' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockPostService.updateById).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/v1/posts/:id', () => {
    it('should return 204 and call deleteById', async () => {
      mockPostService.deleteById.mockResolvedValueOnce({
        message: 'deleted',
        count: 1,
      });

      await request(server)
        .delete(url(`${POSTS_PATH}/${mockingPostUuid}`))
        .expect(HttpStatus.NO_CONTENT);

      expect(mockPostService.deleteById).toHaveBeenCalledWith(mockingPostUuid);
    });

    it('should return 400 when id is not UUID', async () => {
      await request(server)
        .delete(url(`${POSTS_PATH}/not-a-uuid`))
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockPostService.deleteById).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/v1/posts', () => {
    it('should return 204 and call bulk delete', async () => {
      mockPostService.delete.mockResolvedValueOnce({
        message: 'bulk deleted',
        count: 2,
      });

      await request(server)
        .delete(url(POSTS_PATH))
        .send({ postIds: [mockingPostUuid] })
        .expect(HttpStatus.NO_CONTENT);

      expect(mockPostService.delete).toHaveBeenCalledWith(
        expect.objectContaining({ postIds: [mockingPostUuid] }),
      );
    });

    it('should return 400 when payload invalid', async () => {
      await request(server)
        .delete(url(POSTS_PATH))
        .send({ postIds: ['not-a-uuid'] })
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockPostService.delete).not.toHaveBeenCalled();
    });
  });
});
