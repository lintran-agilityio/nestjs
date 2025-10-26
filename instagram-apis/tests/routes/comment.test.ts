// libs
import { SuperTest, Test } from "supertest";
import { API_ENDPOINTS, STATUS_CODE } from "@/constants";
import { COMMENTS_PAGINATION } from "@/mocks";
import { RequestAuthenticationType } from "@/types";
import { NextFunction } from "express";

describe('Comments routes for success', () => {
  let app: any;
  let requestApp: SuperTest<Test>;
  let commentController: any;

  const pathComments = API_ENDPOINTS.COMMENTS;
  const pathPostComments = API_ENDPOINTS.POST_COMMENTS.replace(':id', '1');
  const pathPostCommentsId = API_ENDPOINTS.POST_COMMENT_BY_ID.replace(':id', '1').replace(':commentId', '1');

  beforeAll(() => {
    // jest.resetModules();
    jest.isolateModules(() => {

      jest.doMock('@/utils', () => ({
        __esModule: true,
        generateToken: {
          decodeToken: jest.fn().mockReturnValue({
            exp: Math.floor(Date.now() / 1000) + 60,
            isAdmin: true,
            userId: 1
          })
        }
      }));

      // Mock controller
      jest.doMock('@/controllers/comment.controller', () => ({
        commentController: {
          getAll: jest.fn((_req, res) => res.status(STATUS_CODE.OK).json({ data: COMMENTS_PAGINATION })),
          getPostsComment: jest.fn((_req, res) => res.status(STATUS_CODE.OK).json({ data: COMMENTS_PAGINATION })),
          getPostsCommentById: jest.fn((_req, res) => res.status(STATUS_CODE.OK).json({ data: COMMENTS_PAGINATION[0] })),
          postPostsComments: jest.fn((_req, res) => res.status(STATUS_CODE.CREATED).json({ data: COMMENTS_PAGINATION[0] })),
          deletePostsComments: jest.fn((_req, res) => res.status(STATUS_CODE.NO_CONTENT).end()),
          deletePostsCommentById: jest.fn((_req, res) => res.status(STATUS_CODE.NO_CONTENT).end())
        }
      }));

      // Mock middleware validate-request
      jest.doMock('@/middlewares/validate-request.middleware', () => ({
        __esModule: true,
        validateRequest: jest.fn(() => (_req: RequestAuthenticationType, _res: Response, next: NextFunction) => next())
      }));

      const express = require('express');
      const { commentsRouter } = require('@/routes/comments.route');
      commentController = require('@/controllers/comment.controller').commentController;

      app = express();
      app.use(express.json());
      commentsRouter(app);
      requestApp = require('supertest')(app);
    });
  });

  afterAll(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it(`DELETE ${pathPostComments} success`, async () => {
    const res = await requestApp.delete(pathPostComments).set('Authorization', 'Bearer faketoken');

    expect(commentController.deletePostsComments).toHaveBeenCalled();
    expect(res.status).toBe(STATUS_CODE.NO_CONTENT);
  });

  it(`DELETE ${pathPostCommentsId} success`, async () => {
    const res = await requestApp.delete(pathPostCommentsId).set('Authorization', 'Bearer faketoken');

    expect(commentController.deletePostsCommentById).toHaveBeenCalled();
    expect(res.status).toBe(STATUS_CODE.NO_CONTENT);
  });
});
