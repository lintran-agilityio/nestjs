// Libs
import { Test, TestingModule } from '@nestjs/testing';

// Local sources
import { CommentController } from './comments.controller';
import { CommentService } from './comments.service';
import {
  mockingCommentUuid,
  mockingPostUuid,
  mockUuidUser,
} from '@app/shared/mocks';

describe('CommentController', () => {
  let controller: CommentController;
  let commentService: any;
  const successMessage = 'ok';

  beforeEach(async () => {
    commentService = {
      getComments: jest.fn(),
      getCommentsByPostId: jest.fn(),
      getCommentById: jest.fn(),
      createComment: jest.fn(),
      updateCommentById: jest.fn(),
      deleteCommentById: jest.fn(),
      deleteComments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentController],
      providers: [{ provide: CommentService, useValue: commentService }],
    }).compile();

    controller = module.get<CommentController>(CommentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getComments should delegate', async () => {
    commentService.getComments.mockResolvedValue({ data: [], total: 0 });
    const result = await controller.getComments({});
    expect(commentService.getComments).toHaveBeenCalled();
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('getCommentsByPostId should delegate', async () => {
    commentService.getCommentsByPostId.mockResolvedValue({
      data: [],
      total: 0,
    });
    const result = await controller.getCommentsByPostId(mockingPostUuid, {});
    expect(commentService.getCommentsByPostId).toHaveBeenCalledWith(
      mockingPostUuid,
      {},
    );
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('getCommentById should delegate', async () => {
    commentService.getCommentById.mockResolvedValue({ id: mockingCommentUuid });
    const result = await controller.getCommentById(mockingCommentUuid);
    expect(commentService.getCommentById).toHaveBeenCalledWith(
      mockingCommentUuid,
    );
    expect(result).toEqual({ id: mockingCommentUuid });
  });

  it('createComment should delegate', async () => {
    commentService.createComment.mockResolvedValue({ id: mockingCommentUuid });
    const result = await controller.createComment(
      { id: mockUuidUser },
      { postId: mockingPostUuid, content },
    );
    expect(commentService.createComment).toHaveBeenCalledWith(mockUuidUser, {
      postId: mockingPostUuid,
      content: mockingcommentinfo.content,
    });
    expect(result).toEqual({ id: mockingCommentUuid });
  });

  it('updateCommentById should delegate', async () => {
    commentService.updateCommentById.mockResolvedValue({
      id: mockingCommentUuid,
      content: 'new',
    });
    const result = await controller.updateCommentById(
      mockingCommentUuid,
      { id: mockUuidUser },
      { content: 'new' },
    );
    expect(commentService.updateCommentById).toHaveBeenCalledWith(
      mockingCommentUuid,
      mockUuidUser,
      {
        content: 'new',
      },
    );
    expect(result).toEqual({ id: mockingCommentUuid, content: 'new' });
  });

  it('deleteCommentById should delegate', async () => {
    commentService.deleteCommentById.mockResolvedValue({
      message: successMessage,
    });
    const result = await controller.deleteCommentById(mockingCommentUuid, {
      id: mockUuidUser,
    });
    expect(commentService.deleteCommentById).toHaveBeenCalledWith(
      mockingCommentUuid,
      mockUuidUser,
    );
    expect(result).toEqual({ message: successMessage });
  });

  it('deleteComments should delegate', async () => {
    commentService.deleteComments.mockResolvedValue({
      message: successMessage,
      count: 1,
    });
    const result = await controller.deleteComments({
      commentIds: [mockingCommentUuid],
    });
    expect(commentService.deleteComments).toHaveBeenCalledWith({
      commentIds: [mockingCommentUuid],
    });
    expect(result).toEqual({ message: successMessage, count: 1 });
  });
});
