// libs
import 'jest';
import express, { NextFunction, Request, Response, Express } from 'express';
import bodyParser from 'body-parser';
import request from 'supertest';
import jwt from 'jwt-simple';

import { RequestAuthenticationType } from '@/types';

jest.mock('@/middlewares/auth.middleware', () => ({
  validateToken: () => (req: RequestAuthenticationType, res: Response, next: NextFunction) => {
    req.userId = 1;
    req.isAdmin = true;
    next();
  },
}));

import { sequelize } from "@/configs";
import HttpExceptionError from '@/exceptions';
import { API_ENDPOINTS, MESSAGES, MESSAGES_AUTHENTICATION, STATUS_CODE } from '@/constants';
import { commentController } from '@/controllers';
import { Comment, Post } from '@/models';
import { MOCKS_POSTS } from '@/mocks';
import { validateToken } from '@/middlewares/auth.middleware';
import * as utils from '@/utils';
import { commentServices } from '@/services';

const app: Express = express();
app.use(bodyParser.json());

describe('Comments controller', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await sequelize.query('PRAGMA foreign_keys = OFF;');
    await sequelize.truncate({ cascade: true });
    await sequelize.query('PRAGMA foreign_keys = ON;');
  
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await sequelize.close();
  });
  
  describe('Comments: Get comments of post', () => {
    beforeEach(async() => {
      await Comment.destroy({ where: {} });
    });

    app.get(API_ENDPOINTS.POST_COMMENTS, commentController.getPostsComment);

    // Middleware handle error
    app.use((err: HttpExceptionError, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message });
    });
    
    it('Should get post comments: return comments', async () => {
      jest.spyOn(Comment, "findAndCountAll").mockResolvedValue({
        count: 2,
        rows: MOCKS_POSTS,
      } as any);      
      const response = await request(app)
        .get(API_ENDPOINTS.POST_COMMENTS.replace(':id', '1'))
        .query({ offset: 0, limit: 10 });

      expect(response.status).toBe(STATUS_CODE.OK);
      expect(response.body.data).toEqual({
        data: MOCKS_POSTS,
        meta: {
          pagination: {
            offset: 0,
            limit: 10,
            total: 2,
          }
        }
      });
    });

    it('Should return error: internal server error', async () => {
      const errorMessage = MESSAGES_AUTHENTICATION.INTERNAL_SERVER_ERROR
      const error = new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, errorMessage);
      jest.spyOn(Comment, "findAndCountAll").mockRejectedValue(error);

      const response = await request(app)
        .get(API_ENDPOINTS.POST_COMMENTS.replace(':id', '1'))
        .query({ offset: 0, limit: 10 });

      expect(response.status).toBe(STATUS_CODE.INTERNAL_SERVER_ERROR);
      expect(response.body.message).toBe(errorMessage);
    });
  });

  describe('Comments: Get comment by ID', () => {
    beforeEach(async() => {
      await Comment.destroy({ where: {} });
    });

    app.get(API_ENDPOINTS.POST_COMMENT_BY_ID, commentController.getPostsCommentById);

    // Middleware handle error
    app.use((err: HttpExceptionError, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message });
    });

    it('Should get post comment by ID: return comment', async () => {
      jest.spyOn(Comment, "findOne").mockResolvedValue(MOCKS_POSTS[0] as any);
      const response = await request(app)
        .get(API_ENDPOINTS.POST_COMMENT_BY_ID.replace(':id', '1').replace(':commentId', '1'));

      expect(response.status).toBe(STATUS_CODE.OK);
      expect(response.body.data).toEqual(MOCKS_POSTS[0]);
    });

    it('Should return error: comment not found', async () => {
      const errorMessage = MESSAGES.ERRORS.COMMENT.NOT_FOUND;
      const error = new HttpExceptionError(STATUS_CODE.NOT_FOUND, errorMessage);
      jest.spyOn(Comment, "findOne").mockResolvedValue(null);

      const response = await request(app)
        .get(API_ENDPOINTS.POST_COMMENT_BY_ID.replace(':id', '1').replace(':commentId', '1'));

      expect(response.status).toBe(STATUS_CODE.NOT_FOUND);
      expect(response.body.message).toBe(errorMessage);
    });

    it('Should return error: internal server error', async () => {
      const errorMessage = MESSAGES_AUTHENTICATION.INTERNAL_SERVER_ERROR;
      const error = new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, errorMessage);
      jest.spyOn(Comment, "findOne").mockRejectedValue(error);

      const response = await request(app)
        .get(API_ENDPOINTS.POST_COMMENT_BY_ID.replace(':id', '1').replace(':commentId', '1'));

      expect(response.status).toBe(STATUS_CODE.INTERNAL_SERVER_ERROR);
      expect(response.body.message).toBe(errorMessage);
    });
  });

  describe('Comments: Create comment for post', () => {
    beforeEach(async() => {
      await Comment.destroy({ where: {} });
    });

    app.post(API_ENDPOINTS.POST_COMMENTS, commentController.postPostsComments);

    // Middleware handle error
    app.use((err: HttpExceptionError, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message });
    });

    it('Should create post comment: return created comment', async () => {
      jest.spyOn(Post, "findOne").mockResolvedValue(MOCKS_POSTS[0] as any);
      jest.spyOn(Comment, "create").mockResolvedValue(MOCKS_POSTS[0] as any);

      const response = await request(app)
        .post(API_ENDPOINTS.POST_COMMENTS.replace(':id', '1'))
        .send({ content: 'This is a comment' });

      expect(response.status).toBe(STATUS_CODE.CREATED);
      expect(response.body.data).toEqual(MOCKS_POSTS[0]);
    });

    it('Should return error: post not found', async () => {
      const errorMessage = MESSAGES.ERRORS.POST.NOT_FOUND;
      const error = new HttpExceptionError(STATUS_CODE.NOT_FOUND, errorMessage);
      jest.spyOn(Post, "findOne").mockResolvedValue(null);

      const response = await request(app)
        .post(API_ENDPOINTS.POST_COMMENTS.replace(':id', '1'))
        .send({ content: 'This is a comment' });

      expect(response.status).toBe(STATUS_CODE.NOT_FOUND);
      expect(response.body.message).toBe(errorMessage);
    });

    it('Should return error: internal server error', async () => {
      const errorMessage = MESSAGES_AUTHENTICATION.INTERNAL_SERVER_ERROR;
      const error = new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, errorMessage);
      jest.spyOn(Post, "findOne").mockRejectedValue(error);

      const response = await request(app)
        .post(API_ENDPOINTS.POST_COMMENTS.replace(':id', '1'))
        .send({ content: 'This is a comment' });

      expect(response.status).toBe(STATUS_CODE.INTERNAL_SERVER_ERROR);
      expect(response.body.message).toBe(errorMessage);
    });

    it('Should return error: when create a comment', async() => {
      const errorMessage = MESSAGES_AUTHENTICATION.INTERNAL_SERVER_ERROR;
      const error = new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, errorMessage);
      jest.spyOn(Post, "findByPk").mockResolvedValue(MOCKS_POSTS[0] as any);
      jest.spyOn(Comment, "create").mockRejectedValue(error);

      const response = await request(app)
        .post(API_ENDPOINTS.POST_COMMENTS.replace(':id', '1'))
        .send({ content: 'This is a comment1' });

      expect(response.status).toBe(STATUS_CODE.INTERNAL_SERVER_ERROR);
      expect(response.body.message).toBe(errorMessage);
    });
  });

  describe('Comments: Delete comment for post', () => {
    let originalToError: typeof utils.toError;
    beforeEach(async() => {
      // Save the original implementation of `toError`
      originalToError = utils.toError;
      await Comment.destroy({ where: {} });
      
      jest.restoreAllMocks();
      jest.spyOn(utils.generateToken, 'decodeToken').mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 60,
        isAdmin: true,
        userId: 1
      });
      jest.spyOn(jwt, 'decode').mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 60,
        isAdmin: true,
        userId: 1
      });
      app.delete(API_ENDPOINTS.POST_COMMENTS, validateToken(), commentController.deletePostsComments);
      
      // Middleware handle error
      app.use((err: HttpExceptionError, _req: Request, res: Response, _next: NextFunction) => {
        res.status(err.status || 500).json({ message: err.message });
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });  

    afterAll(async () => {
      jest.restoreAllMocks();
    });

    const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoibGluKzNAZ20uY29tIiwidXNlcm5hbWUiOiJsaW50cmFuIiwiaXNBZG1pbiI6ZmFsc2UsImV4cCI6MTc1NDkwMjczNX0.k_Qw9EFjykTYm3Y2RE3NZLv6GkQx7dod8Gh5jyxK4-k';
    it('Should delete post comment: return success message', async () => {
      
      jest.spyOn(Comment, "destroy").mockResolvedValue(1);

      const response = await request(app)
        .delete(API_ENDPOINTS.POST_COMMENTS.replace(':id', '1'))
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(STATUS_CODE.NO_CONTENT);
    });

    it('Should return error: comment not found', async () => {

      const errorMessage = MESSAGES.ERRORS.COMMENT.NOT_FOUND_COMMENT_OR_POST;
      jest.spyOn(Comment, "destroy").mockResolvedValue(0);

      const response = await request(app)
        .delete(API_ENDPOINTS.POST_COMMENTS.replace(':id', '1'))
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(STATUS_CODE.NOT_FOUND);
      expect(response.body.message).toBe(errorMessage);
    });

    it('Delete comments - should return error: server error', async () => {
      const error = new HttpExceptionError(
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        MESSAGES_AUTHENTICATION.INTERNAL_SERVER_ERROR
      );
      jest.spyOn(commentServices, 'deletePostsComments').mockRejectedValue(error);

      const response = await request(app)
        .delete(API_ENDPOINTS.POST_COMMENTS.replace(':id', '1'));

      expect(response.status).toBe(STATUS_CODE.INTERNAL_SERVER_ERROR);
      expect(response.body.message).toBe(MESSAGES_AUTHENTICATION.INTERNAL_SERVER_ERROR);
    });
  });

  describe('Comments: delete comment by ID', () => {
    beforeEach(async() => {
      await Comment.destroy({ where: {} });
    });

    app.delete(API_ENDPOINTS.POST_COMMENT_BY_ID, commentController.deletePostsCommentById);

    // Middleware handle error
    app.use((err: HttpExceptionError, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message });
    });

    it('Should delete post comment by ID: return success message', async () => {
      jest.spyOn(Comment, "destroy").mockResolvedValue(1);

      const response = await request(app)
        .delete(API_ENDPOINTS.POST_COMMENT_BY_ID.replace(':id', '1').replace(':commentId', '1'));

      expect(response.status).toBe(STATUS_CODE.NO_CONTENT);
    });

    it('Should return error: comment not found', async () => {
      const errorMessage = MESSAGES.ERRORS.COMMENT.NOT_FOUND_COMMENT_OR_POST;
      jest.spyOn(Comment, "destroy").mockResolvedValue(0);

      const response = await request(app)
        .delete(API_ENDPOINTS.POST_COMMENT_BY_ID.replace(':id', '1').replace(':commentId', '1'));

      expect(response.status).toBe(STATUS_CODE.NOT_FOUND);
      expect(response.body.message).toBe(errorMessage);
    });

    it('Delete user - should return error: server error', async () => {
      const error = new HttpExceptionError(
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        MESSAGES_AUTHENTICATION.INTERNAL_SERVER_ERROR
      );
      jest.spyOn(commentServices, 'deletePostsCommentById').mockRejectedValue(error);

      const response = await request(app)
        .delete(API_ENDPOINTS.POST_COMMENTS.replace(':id', '1').replace(':commentId', '1'));

      expect(response.status).toBe(STATUS_CODE.NOT_FOUND);
      expect(response.body.message).toBe( MESSAGES.ERRORS.COMMENT.NOT_FOUND_COMMENT_OR_POST);
    });
  });
});
