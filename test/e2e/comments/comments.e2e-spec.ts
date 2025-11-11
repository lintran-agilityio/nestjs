// libs
import { INestApplication, HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import type { Server } from 'http';

// app modules
import { CommentController } from '@app/apis/comments/comments.controller';
import { CommentService } from '@app/apis/comments/comments.service';
import { Comment } from '@app/apis/comments/entities';
import {
  CommentPaginationResponseDto,
  CreateCommentRequestDto,
  UpdateCommentRequestDto,
  DeleteCommentsRequestDto,
  QueryCommentParamDto,
} from '@app/apis/comments/dtos';
import { MetadataResponseDto } from '@app/shared/dtos';
import { JwtAuthGuard, RolesGuard } from '@app/shared/guards';
import { configureApp, url } from '@e2e/helpers/app';
import { createMockJwtGuard, createMockRolesGuard } from '@e2e/helpers/guards';
import { MockHandleErrorArgs } from '@app/shared/interfaces';
import { OrderBy } from '@app/shared/types';
import { PATHS } from '@app/shared/constants';
import {
  mockingCommentInfo,
  mockingCommentUuid,
  mockingMetadata,
  mockingPostUuid,
} from '@app/shared/mocks';

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

describe('Comments - Modules (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  const COMMENTS_PATH = PATHS.COMMENTS;

  const mockCommentService: {
    getCommentsRecently: jest.MockedFunction<
      CommentService['getCommentsRecently']
    >;
    getCommentsByPostId: jest.MockedFunction<
      CommentService['getCommentsByPostId']
    >;
    getCommentById: jest.MockedFunction<CommentService['getCommentById']>;
    createComment: jest.MockedFunction<CommentService['createComment']>;
    updateCommentById: jest.MockedFunction<CommentService['updateCommentById']>;
    deleteCommentById: jest.MockedFunction<CommentService['deleteCommentById']>;
    deleteComments: jest.MockedFunction<CommentService['deleteComments']>;
  } = {
    getCommentsRecently: jest.fn<
      Promise<CommentPaginationResponseDto>,
      [QueryCommentParamDto]
    >(),
    getCommentsByPostId: jest.fn(),
    getCommentById: jest.fn(),
    createComment: jest.fn(),
    updateCommentById: jest.fn(),
    deleteCommentById: jest.fn(),
    deleteComments: jest.fn(),
  };

  const mockComment: Comment = Object.assign(new Comment(), {
    ...mockingCommentInfo,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Partial<Comment>);

  const mockPagination: CommentPaginationResponseDto = {
    data: [mockComment],
    meta: mockingMetadata,
  } as CommentPaginationResponseDto;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CommentController],
      providers: [{ provide: CommentService, useValue: mockCommentService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(createMockJwtGuard())
      .overrideGuard(RolesGuard)
      .useValue(createMockRolesGuard())
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

  describe('GET /api/v1/comments', () => {
    it('should return 200 with paginated comments', async () => {
      mockCommentService.getCommentsRecently.mockResolvedValueOnce(
        mockPagination,
      );
      const query = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        orderBy: OrderBy.ASC,
      };

      const res = await request(server)
        .get(url(COMMENTS_PATH))
        .query(query)
        .expect(HttpStatus.OK);
      type PostListResponse = { data: Comment[]; meta: MetadataResponseDto };
      const body = res.body as unknown as PostListResponse;

      expect(Array.isArray(body.data)).toBe(true);
      expect(body.meta).toBeDefined();
      expect(body.data.length).toBe(1);
      expect(body.meta).toEqual(mockingMetadata);
      expect(mockCommentService.getCommentsRecently).toHaveBeenCalledWith(
        expect.objectContaining(query),
      );
    });

    it('should return 400 when query invalid', async () => {
      await request(server)
        .get(url(COMMENTS_PATH))
        .query({ page: 'zero', limit: -1 })
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockCommentService.getCommentsRecently).not.toHaveBeenCalled();
    });

    it('should return 400 when extra field present', async () => {
      await request(server)
        .get(url(COMMENTS_PATH))
        .query({ page: 1, limit: 10, extra: 'x' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockCommentService.getCommentsRecently).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/comments/post/:postId', () => {
    it('should return 200 with comments for a post', async () => {
      mockCommentService.getCommentsByPostId.mockResolvedValueOnce(
        mockPagination,
      );
      const query = { page: 1, limit: 10 };

      const res = await request(server)
        .get(url(`${COMMENTS_PATH}/posts/${mockingPostUuid}`))
        .query(query)
        .expect(HttpStatus.OK);
      type PostListResponse = { data: Comment[]; meta: MetadataResponseDto };
      const body = res.body as unknown as PostListResponse;

      expect(Array.isArray(body.data)).toBe(true);
      expect(body.meta).toBeDefined();
      expect(mockCommentService.getCommentsByPostId).toHaveBeenCalledWith(
        mockingPostUuid,
        expect.objectContaining(query),
      );
    });

    it('should return 400 when postId is not UUID', async () => {
      await request(server)
        .get(url(`${COMMENTS_PATH}/posts/not-a-uuid`))
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockCommentService.getCommentsByPostId).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/comments/:id', () => {
    it('should return 200 with comment by id', async () => {
      mockCommentService.getCommentById.mockResolvedValueOnce(mockComment);

      const res = await request(server)
        .get(url(`${COMMENTS_PATH}/${mockingCommentUuid}`))
        .expect(HttpStatus.OK);

      expect(res.body).toEqual(
        expect.objectContaining({ id: mockingCommentUuid }),
      );
      expect(mockCommentService.getCommentById).toHaveBeenCalledWith(
        mockingCommentUuid,
      );
    });

    it('should return 400 when id is not UUID', async () => {
      await request(server)
        .get(url(`${COMMENTS_PATH}/not-a-uuid`))
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockCommentService.getCommentById).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/comments', () => {
    const payload: CreateCommentRequestDto = {
      content: 'Nice post!',
      postId: mockingPostUuid,
    };

    it('should return 201 and created comment', async () => {
      mockCommentService.createComment.mockResolvedValueOnce(mockComment);

      const res = await request(server)
        .post(url(COMMENTS_PATH))
        .set('Content-Type', 'application/json')
        .send(payload)
        .expect(HttpStatus.CREATED);

      expect(res.body).toEqual(
        expect.objectContaining({ content: payload.content }),
      );
      expect(mockCommentService.createComment).toHaveBeenCalledTimes(1);
      // first arg is userId from decorator; assert dto is second arg
      expect(mockCommentService.createComment.mock.calls[0][1]).toEqual(
        expect.objectContaining(payload),
      );
    });

    it('should return 400 when payload invalid', async () => {
      await request(server)
        .post(url(COMMENTS_PATH))
        .send({ content: '', postId: 'not-a-uuid' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockCommentService.createComment).not.toHaveBeenCalled();
    });

    it('should return 400 when extra field present', async () => {
      await request(server)
        .post(url(COMMENTS_PATH))
        .send({ ...payload, extra: 'x' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockCommentService.createComment).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /api/v1/comments/:id', () => {
    const updatePayload: UpdateCommentRequestDto = {
      content: 'Edited comment',
    };

    it('should return 200 and updated comment', async () => {
      const updated = { ...mockComment, ...updatePayload } as Comment;
      mockCommentService.updateCommentById.mockResolvedValueOnce(updated);

      const res = await request(server)
        .patch(url(`${COMMENTS_PATH}/${mockingCommentUuid}`))
        .send(updatePayload)
        .expect(HttpStatus.OK);

      expect(res.body).toEqual(
        expect.objectContaining({ content: updatePayload.content }),
      );
      // args: id, userId, dto
      expect(mockCommentService.updateCommentById.mock.calls[0][0]).toBe(
        mockingCommentUuid,
      );
      expect(mockCommentService.updateCommentById.mock.calls[0][2]).toEqual(
        expect.objectContaining(updatePayload),
      );
    });

    it('should return 400 when id is not UUID', async () => {
      await request(server)
        .patch(url(`${COMMENTS_PATH}/not-a-uuid`))
        .send(updatePayload)
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockCommentService.updateCommentById).not.toHaveBeenCalled();
    });

    it('should return 400 when body has extra field', async () => {
      await request(server)
        .patch(url(`${COMMENTS_PATH}/${mockingCommentUuid}`))
        .send({ ...updatePayload, extra: 'x' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockCommentService.updateCommentById).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/v1/comments/:id', () => {
    it('should return 200 and call delete by id', async () => {
      const mockingDeleteMessage = 'deleted';
      mockCommentService.deleteCommentById.mockResolvedValueOnce({
        message: mockingDeleteMessage,
        count: 1,
      });

      const res = await request(server)
        .delete(url(`${COMMENTS_PATH}/${mockingCommentUuid}`))
        .expect(HttpStatus.NO_CONTENT);
      // args: id, userId
      expect(mockCommentService.deleteCommentById.mock.calls[0][0]).toBe(
        mockingCommentUuid,
      );
    });

    it('should return 400 when id is not UUID', async () => {
      await request(server)
        .delete(url(`${COMMENTS_PATH}/not-a-uuid`))
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockCommentService.deleteCommentById).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/v1/comments', () => {
    it('should return 200 and call bulk delete', async () => {
      const payload: DeleteCommentsRequestDto = {
        commentIds: [mockingCommentUuid],
      };
      const mockingDeleteMessage = 'bulk deleted';
      mockCommentService.deleteComments.mockResolvedValueOnce({
        message: mockingDeleteMessage,
        count: 1,
      });

      const res = await request(server)
        .delete(url(COMMENTS_PATH))
        .set('Content-Type', 'application/json')
        .send(payload)
        .expect(HttpStatus.NO_CONTENT);
      expect(mockCommentService.deleteComments).toHaveBeenCalledWith(
        expect.objectContaining(payload),
      );
    });

    it('should return 400 when payload invalid', async () => {
      await request(server)
        .delete(url(COMMENTS_PATH))
        .send({ commentIds: ['not-a-uuid'] })
        .expect(HttpStatus.BAD_REQUEST);

      expect(mockCommentService.deleteComments).not.toHaveBeenCalled();
    });
  });
});
