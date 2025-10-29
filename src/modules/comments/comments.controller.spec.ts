// Libs
import { Test, TestingModule } from '@nestjs/testing';

// Local sources
import { CommentController } from './comments.controller';
import { CommentService } from './comments.service';
import { Comment } from './entities';
import {
  CreateCommentRequestDto,
  UpdateCommentRequestDto,
  DeleteCommentsRequestDto,
  CommentPaginationResponseDto,
  QueryCommentParamDto,
} from './dtos';
import { IUserInfo, IMessageAndCountResponse } from '@app/shared/types';
import {
  mockingCommentInfo,
  mockingCommentUuid,
  mockingPostUuid,
  mockingUserResponse,
  mockUuidUser,
} from '../../shared/mocks';

describe('CommentController', () => {
  let controller: CommentController;
  let commentService: {
    getComments: jest.Mock<
      Promise<CommentPaginationResponseDto>,
      [QueryCommentParamDto]
    >;
    getCommentsByPostId: jest.Mock<
      Promise<CommentPaginationResponseDto>,
      [string, QueryCommentParamDto]
    >;
    getCommentById: jest.Mock<Promise<Comment>, [string]>;
    createComment: jest.Mock<
      Promise<Comment>,
      [string, CreateCommentRequestDto]
    >;
    updateCommentById: jest.Mock<
      Promise<Comment>,
      [string, string, UpdateCommentRequestDto]
    >;
    deleteCommentById: jest.Mock<
      Promise<IMessageAndCountResponse>,
      [string, string]
    >;
    deleteComments: jest.Mock<
      Promise<IMessageAndCountResponse>,
      [DeleteCommentsRequestDto]
    >;
  };
  const successMessage = 'ok';
  const mockUser: IUserInfo = {
    id: mockUuidUser,
    email: mockingUserResponse.email,
    role: mockingUserResponse.role,
    status: mockingUserResponse.status,
    firstName: mockingUserResponse.firstName,
    lastName: mockingUserResponse.lastName,
  };

  beforeEach(async () => {
    commentService = {
      getComments: jest.fn<
        Promise<CommentPaginationResponseDto>,
        [QueryCommentParamDto]
      >(),
      getCommentsByPostId: jest.fn<
        Promise<CommentPaginationResponseDto>,
        [string, QueryCommentParamDto]
      >(),
      getCommentById: jest.fn<Promise<Comment>, [string]>(),
      createComment: jest.fn<
        Promise<Comment>,
        [string, CreateCommentRequestDto]
      >(),
      updateCommentById: jest.fn<
        Promise<Comment>,
        [string, string, UpdateCommentRequestDto]
      >(),
      deleteCommentById: jest.fn<
        Promise<IMessageAndCountResponse>,
        [string, string]
      >(),
      deleteComments: jest.fn<
        Promise<IMessageAndCountResponse>,
        [DeleteCommentsRequestDto]
      >(),
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
    const mockResponse: CommentPaginationResponseDto = {
      data: [],
      meta: {
        total: 0,
        totalPages: 0,
        page: 1,
        limit: 10,
      },
    };
    commentService.getComments.mockResolvedValue(mockResponse);
    const result: CommentPaginationResponseDto = await controller.getComments(
      {},
    );
    expect(commentService.getComments).toHaveBeenCalled();
    expect(result).toEqual(mockResponse);
  });

  it('getCommentsByPostId should delegate', async () => {
    const mockResponse: CommentPaginationResponseDto = {
      data: [],
      meta: {
        total: 0,
        totalPages: 0,
        page: 1,
        limit: 10,
      },
    };
    commentService.getCommentsByPostId.mockResolvedValue(mockResponse);
    const result: CommentPaginationResponseDto =
      await controller.getCommentsByPostId(mockingPostUuid, {});
    expect(commentService.getCommentsByPostId).toHaveBeenCalledWith(
      mockingPostUuid,
      {},
    );
    expect(result).toEqual(mockResponse);
  });

  it('getCommentById should delegate', async () => {
    const mockComment = Object.assign(new Comment(), {
      id: mockingCommentUuid,
    } as Partial<Comment>);
    commentService.getCommentById.mockResolvedValue(mockComment);
    const result: Comment = await controller.getCommentById(mockingCommentUuid);
    expect(commentService.getCommentById).toHaveBeenCalledWith(
      mockingCommentUuid,
    );
    expect(result).toEqual(mockComment);
  });

  it('createComment should delegate', async () => {
    const mockComment = Object.assign(new Comment(), {
      id: mockingCommentUuid,
    } as Partial<Comment>);
    commentService.createComment.mockResolvedValue(mockComment);
    const result: Comment = await controller.createComment(mockUser, {
      postId: mockingPostUuid,
      content: mockingCommentInfo.content,
    });
    expect(commentService.createComment).toHaveBeenCalledWith(mockUuidUser, {
      postId: mockingPostUuid,
      content: mockingCommentInfo.content,
    });
    expect(result).toEqual(mockComment);
  });

  it('updateCommentById should delegate', async () => {
    const mockComment = Object.assign(new Comment(), {
      id: mockingCommentUuid,
      content: 'new',
    } as Partial<Comment>);
    commentService.updateCommentById.mockResolvedValue(mockComment);
    const result: Comment = await controller.updateCommentById(
      mockingCommentUuid,
      mockUser,
      { content: 'new' },
    );
    expect(commentService.updateCommentById).toHaveBeenCalledWith(
      mockingCommentUuid,
      mockUuidUser,
      {
        content: 'new',
      },
    );
    expect(result).toEqual(mockComment);
  });

  it('deleteCommentById should delegate', async () => {
    commentService.deleteCommentById.mockResolvedValue({
      message: successMessage,
    });
    const result: IMessageAndCountResponse = await controller.deleteCommentById(
      mockingCommentUuid,
      mockUser,
    );
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
    const result: IMessageAndCountResponse = await controller.deleteComments({
      commentIds: [mockingCommentUuid],
    });
    expect(commentService.deleteComments).toHaveBeenCalledWith({
      commentIds: [mockingCommentUuid],
    });
    expect(result).toEqual({ message: successMessage, count: 1 });
  });
});
