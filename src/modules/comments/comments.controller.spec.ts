// Libs
import { Test, TestingModule } from '@nestjs/testing';

// Local sources
import { CommentController } from './comments.controller';
import { CommentService } from './comments.service';

describe('CommentController', () => {
  let controller: CommentController;
  let commentService: any;

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
    const result = await controller.getComments({} as any);
    expect(commentService.getComments).toHaveBeenCalled();
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('getCommentsByPostId should delegate', async () => {
    commentService.getCommentsByPostId.mockResolvedValue({
      data: [],
      total: 0,
    });
    const result = await controller.getCommentsByPostId('p1' as any, {} as any);
    expect(commentService.getCommentsByPostId).toHaveBeenCalledWith('p1', {});
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('getCommentById should delegate', async () => {
    commentService.getCommentById.mockResolvedValue({ id: 'c1' });
    const result = await controller.getCommentById('c1' as any);
    expect(commentService.getCommentById).toHaveBeenCalledWith('c1');
    expect(result).toEqual({ id: 'c1' });
  });

  it('createComment should delegate', async () => {
    commentService.createComment.mockResolvedValue({ id: 'c1' });
    const result = await controller.createComment(
      { id: 'u1' } as any,
      { postId: 'p1', content: 'hi' } as any,
    );
    expect(commentService.createComment).toHaveBeenCalledWith('u1', {
      postId: 'p1',
      content: 'hi',
    });
    expect(result).toEqual({ id: 'c1' });
  });

  it('updateCommentById should delegate', async () => {
    commentService.updateCommentById.mockResolvedValue({
      id: 'c1',
      content: 'new',
    });
    const result = await controller.updateCommentById(
      'c1' as any,
      { id: 'u1' } as any,
      { content: 'new' } as any,
    );
    expect(commentService.updateCommentById).toHaveBeenCalledWith('c1', 'u1', {
      content: 'new',
    });
    expect(result).toEqual({ id: 'c1', content: 'new' });
  });

  it('deleteCommentById should delegate', async () => {
    commentService.deleteCommentById.mockResolvedValue({ message: 'ok' });
    const result = await controller.deleteCommentById(
      'c1' as any,
      { id: 'u1' } as any,
    );
    expect(commentService.deleteCommentById).toHaveBeenCalledWith('c1', 'u1');
    expect(result).toEqual({ message: 'ok' });
  });

  it('deleteComments should delegate', async () => {
    commentService.deleteComments.mockResolvedValue({
      message: 'ok',
      count: 1,
    });
    const result = await controller.deleteComments({
      commentIds: ['c1'],
    } as any);
    expect(commentService.deleteComments).toHaveBeenCalledWith({
      commentIds: ['c1'],
    });
    expect(result).toEqual({ message: 'ok', count: 1 });
  });
});
