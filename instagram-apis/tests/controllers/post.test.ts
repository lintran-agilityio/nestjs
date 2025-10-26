// libs
import 'jest';
import express, { NextFunction, Request, Response, Express } from 'express';
import bodyParser from 'body-parser';
import request from 'supertest';
import jwt from 'jwt-simple';

import { RequestAuthenticationType } from '@/types';
import { sequelize } from "@/configs";
import { Post, User } from '@/models';
import { MOCKS_POSTS } from '@/mocks';
import { API_ENDPOINTS, MESSAGES, MESSAGES_AUTHENTICATION, MESSAGES_VALIDATION, PAGINATION, STATUS_CODE } from '@/constants';
import { postController } from '@/controllers';
import HttpExceptionError from '@/exceptions';
import * as authMiddleware from '@/middlewares/auth.middleware';
import { postService } from '@/services';
import * as findAllDataModule from '@/utils/pagination';

jest.mock('@/middlewares/auth.middleware', () => ({
  validateToken: () => (req: RequestAuthenticationType, _res: Response, next: NextFunction) => {
    req.userId = 1;
    req.isAdmin = true;
    next();
  },
}));

const app: Express = express();
app.use(bodyParser.json());

describe('Posts Controller', () => {
  const { OFFSET, LIMIT } = PAGINATION.DEFAULT;
  const DATABASE_ERROR = 'Database error';
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await sequelize.query('PRAGMA foreign_keys = OFF;');
    await sequelize.truncate({ cascade: true });
    await sequelize.query('PRAGMA foreign_keys = ON;');
  
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Get posts', () => {
    beforeEach(async() => {
      await Post.destroy({ where: {} });
    });

    app.get(API_ENDPOINTS.POSTS, authMiddleware.validateToken(), postController.getAll);

    // Middleware handle error
    app.use((err: HttpExceptionError, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message });
    });

    const paginationData = {
      rows: MOCKS_POSTS,
      count: MOCKS_POSTS.length
    };
    const resDataPagination = {
      data: MOCKS_POSTS,
      meta: {
        pagination: {
          offset: OFFSET,
          limit: LIMIT,
          total: MOCKS_POSTS.length,
        }
      }
    };
    it('Should get posts with pagination', async () => {
      jest.spyOn(Post, 'findAndCountAll').mockResolvedValue(paginationData as any);  
      const response = await request(app)
        .get(API_ENDPOINTS.POSTS)
        .query({ offset: OFFSET, limit: LIMIT });

      expect(response.status).toBe(STATUS_CODE.OK);
      expect(response.body.data).toEqual(resDataPagination);
    });

    it('should get error when get posts', async () => {
      const error = new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, DATABASE_ERROR);
      jest.spyOn(Post, 'findAndCountAll').mockRejectedValue(error);
      jest.spyOn(findAllDataModule, 'findAllData').mockRejectedValue(error);
      const response = await request(app)
        .get(API_ENDPOINTS.POSTS)
        .query({ offset: OFFSET, limit: LIMIT });

      expect(response.status).toBe(STATUS_CODE.INTERNAL_SERVER_ERROR);
      expect(response.body.message).toBe(DATABASE_ERROR);
    });
  });

  describe('Get post by ID', () => {
    beforeEach(async() => {
      await Post.destroy({ where: {} });
    });

    app.get(`${API_ENDPOINTS.POST_BY_ID}`, authMiddleware.validateToken(), postController.getPostById);

    // Middleware handle error
    app.use((err: HttpExceptionError, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message });
    });

    it('Should get post by ID', async () => {
      const post = MOCKS_POSTS[0];
      jest.spyOn(Post, 'findByPk').mockResolvedValue(post as any);
      const response = await request(app)
        .get(`${API_ENDPOINTS.POSTS}/${post.id}`);

      expect(response.status).toBe(STATUS_CODE.OK);
      expect(response.body.data).toEqual(post);
    });

    it('Should return error when post not found', async () => {
      jest.spyOn(Post, 'findByPk').mockResolvedValue(null);
      const response = await request(app)
        .get(`${API_ENDPOINTS.POSTS}/999`);

      expect(response.status).toBe(STATUS_CODE.NOT_FOUND);
      expect(response.body.message).toBe('Post not found');
    });

    it('Should return error when get post by ID', async () => {
      const error = new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, DATABASE_ERROR);
      jest.spyOn(Post, 'findByPk').mockRejectedValue(error);
      const response = await request(app)
        .get(`${API_ENDPOINTS.POSTS}/1`);

      expect(response.status).toBe(STATUS_CODE.INTERNAL_SERVER_ERROR);
      expect(response.body.message).toBe(DATABASE_ERROR);
    });
  });

  describe('Create post by user', () => {
    beforeEach(async() => {
      await Post.destroy({ where: {} });
    });

    app.post(API_ENDPOINTS.POSTS, authMiddleware.validateToken(), postController.createPostByUser);

    // Middleware handle error
    app.use((err: HttpExceptionError, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message });
    });

    it('Should create post by user', async () => {
      const newPost = { ...MOCKS_POSTS[0], authorId: 1 };
      jest.spyOn(Post, 'findOne').mockResolvedValue(null);
      jest.spyOn(User, 'findByPk').mockResolvedValue({
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        toJSON: () => ({
          userId: 1,
          username: 'testuser',
          email: 'test@example.com',
        }),
      } as any);
      jest.spyOn(Post, 'create').mockResolvedValue(newPost as any);
      const response = await request(app)
        .post(API_ENDPOINTS.POSTS)
        .send(newPost);

      expect(response.status).toBe(STATUS_CODE.CREATED);
      expect(response.body.data).toEqual(newPost);
    });

    it('Should return error INVALID_SLUG when slug is existed', async () => {
      jest.spyOn(Post, 'findOne').mockResolvedValue(MOCKS_POSTS[0] as any);
      const response = await request(app)
        .post(API_ENDPOINTS.POSTS)
        .send({ ...MOCKS_POSTS[0], slug: 'existing-slug' });

      expect(response.status).toBe(STATUS_CODE.BAD_REQUEST);
      expect(response.body.message).toBe(MESSAGES.ERRORS.POST.INVALID_SLUG);
    });

    it('Should return server error when find slug existing', async() => {
      const error = new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, DATABASE_ERROR);
      jest.spyOn(Post, 'findOne').mockRejectedValue(error);

      const response = await request(app)
        .post(API_ENDPOINTS.POSTS)
        .send({ ...MOCKS_POSTS[0], authorId: 999 });

      expect(response.status).toBe(STATUS_CODE.INTERNAL_SERVER_ERROR);
      expect(response.body.message).toBe(DATABASE_ERROR);
    });

    it('Should return error when user not found', async () => {
      jest.spyOn(Post, 'findOne').mockResolvedValue(null);
      jest.spyOn(User, 'findByPk').mockResolvedValue(null);
      const response = await request(app)
        .post(API_ENDPOINTS.POSTS)
        .send({ ...MOCKS_POSTS[0], authorId: 999 });

      expect(response.status).toBe(STATUS_CODE.NOT_FOUND);
      expect(response.body.message).toBe(MESSAGES.ERRORS.POST.USER_NOT_FOUND);
    });

    it('Should return error when create post fails', async () => {
      const error = new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, DATABASE_ERROR);
      jest.spyOn(Post, 'findOne').mockResolvedValue(null);
      jest.spyOn(User, 'findByPk').mockResolvedValue({
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        toJSON: () => ({
          userId: 1,
          username: 'testuser',
          email: 'test@example.com',
        }),
      } as any);
      jest.spyOn(Post, 'create').mockRejectedValue(error);
      const response = await request(app)
        .post(API_ENDPOINTS.POSTS)
        .send(MOCKS_POSTS[0]);

      expect(response.status).toBe(STATUS_CODE.INTERNAL_SERVER_ERROR);
      expect(response.body.message).toBe(DATABASE_ERROR);
    });
  });

  describe('Update post by user', () => {
    beforeEach(async() => {
      await Post.destroy({ where: {} });
    });
    
    afterEach(async () => {
      jest.restoreAllMocks();
    });

    app.put(`${API_ENDPOINTS.POST_BY_ID}`, authMiddleware.validateToken(), postController.putUsersPostById);

    // Middleware handle error
    app.use((err: HttpExceptionError, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message });
    });

    it('Should update post by user', async () => {
      const updatedPost = { ...MOCKS_POSTS[0], title: 'Updated Title' };
      jest.spyOn(User, 'findByPk').mockResolvedValue({
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        toJSON: () => ({
          userId: 1,
          username: 'testuser',
          email: 'test@example.com',
        }),
      } as any);
      jest.spyOn(postService, 'getPostByAuthorId').mockResolvedValue({
        ...MOCKS_POSTS[0],
        update: jest.fn().mockResolvedValue(true),
      } as any);
      jest.spyOn(Post, 'findOne').mockResolvedValue(null as any);
      
      jest.spyOn(Post.prototype, 'update').mockResolvedValue(true as any);
      const response = await request(app)
        .put(`${API_ENDPOINTS.POSTS}/${updatedPost.id}`)
        .send(updatedPost);

      expect(response.status).toBe(STATUS_CODE.NO_CONTENT);
    });

    it('Should return server error when update a post', async() => {
      const error = new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, DATABASE_ERROR);
      const updatedPost = { ...MOCKS_POSTS[0], title: 'Updated Title' };
      jest.spyOn(User, 'findByPk').mockResolvedValue({
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        toJSON: () => ({
          userId: 1,
          username: 'testuser',
          email: 'test@example.com',
        }),
      } as any);
      jest.spyOn(postService, 'getPostByAuthorId').mockResolvedValue({
        ...MOCKS_POSTS[0],
        update: jest.fn().mockRejectedValue(error),
      } as any);
      jest.spyOn(Post, 'findOne').mockResolvedValue(null as any);
      
      jest.spyOn(Post.prototype, 'update').mockRejectedValue(error);
      const response = await request(app)
        .put(`${API_ENDPOINTS.POSTS}/${updatedPost.id}`)
        .send(updatedPost);

      expect(response.status).toBe(STATUS_CODE.INTERNAL_SERVER_ERROR);
      expect(response.body.message).toBe(DATABASE_ERROR);
    });

    it('Should return error User not found when updating post', async () => {
      jest.spyOn(User, 'findByPk').mockResolvedValue(null);
      const response = await request(app)
        .put(`${API_ENDPOINTS.POSTS}/1`)
        .send(MOCKS_POSTS[0]);
      expect(response.status).toBe(STATUS_CODE.NOT_FOUND);
      expect(response.body.message).toBe(MESSAGES_AUTHENTICATION.USER_NOT_FOUND);
    });

    it('Should return error when post not found', async () => {
      jest.spyOn(User, 'findByPk').mockResolvedValue({
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        toJSON: () => ({
          userId: 1,
          username: 'testuser',
          email: 'test@example.com',
        }),
      } as any);
      jest.spyOn(Post, 'findOne').mockResolvedValue(null);
      const response = await request(app)
        .put(`${API_ENDPOINTS.POSTS}/999`)
        .send(MOCKS_POSTS[0]);

      expect(response.status).toBe(STATUS_CODE.NOT_FOUND);
      expect(response.body.message).toBe(MESSAGES.ERRORS.POST.NOT_FOUND_OWNED_USER);
    });

    it('Should return error Slug already exists when call update post by user', async () => {
      const updatedPost = { ...MOCKS_POSTS[0], title: 'Updated Title' };
      jest.spyOn(User, 'findByPk').mockResolvedValue({
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        toJSON: () => ({
          userId: 1,
          username: 'testuser',
          email: 'test@example.com',
        }),
      } as any);
      jest.spyOn(postService, 'getPostByAuthorId').mockResolvedValue({
        ...MOCKS_POSTS[0],
        update: jest.fn().mockResolvedValue(true),
      } as any);
      jest.spyOn(Post, 'findOne').mockResolvedValue({ ...MOCKS_POSTS[0]} as any);
      
      jest.spyOn(Post.prototype, 'update').mockResolvedValue(true as any);
      const response = await request(app)
        .put(`${API_ENDPOINTS.POSTS}/${updatedPost.id}`)
        .send(updatedPost);

      expect(response.body.message).toBe(MESSAGES_VALIDATION.INVALID_SLUG_POST);
    });

    it('Should return error when update post fails', async () => {
      jest.spyOn(User, 'findByPk').mockResolvedValue({
        userId: 1,
        username: 'testuser',
        email: 'test@example.com',
        toJSON: () => ({
          userId: 1,
          username: 'testuser',
          email: 'test@example.com',
        }),
      } as any);
      const error = new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, DATABASE_ERROR);
      jest.spyOn(Post, 'findByPk').mockResolvedValue(MOCKS_POSTS[0] as any);
      jest.spyOn(Post, 'update').mockRejectedValue(error);
      const response = await request(app)
        .put(`${API_ENDPOINTS.POSTS}/${MOCKS_POSTS[0].id}`)
        .send(MOCKS_POSTS[0]);

      expect(response.status).toBe(STATUS_CODE.INTERNAL_SERVER_ERROR);
    });
  });

  describe('Delete posts', () => {
    beforeEach(async() => {
      await Post.destroy({ where: {} });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    app.delete(API_ENDPOINTS.POSTS, authMiddleware.validateToken(), postController.deletePosts);

    // Middleware handle error
    app.use((err: HttpExceptionError, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message });
    });

    it('Should delete all posts', async () => {
      jest.spyOn(Post, 'destroy').mockResolvedValue(1);
      const response = await request(app)
        .delete(API_ENDPOINTS.POSTS);

      expect(response.status).toBe(STATUS_CODE.OK);
      expect(response.body.message).toBe(MESSAGES.SUCCESS.DELETE);
    });

    it('Should return error when no posts to delete', async () => {
      jest.spyOn(Post, 'destroy').mockResolvedValue(0);
      const response = await request(app)
        .delete(API_ENDPOINTS.POSTS);

      expect(response.status).toBe(STATUS_CODE.NOT_FOUND);
      expect(response.body.message).toBe(MESSAGES.ERRORS.POST.NOT_FOUND);
    });

    it('Should return error when delete posts fails', async () => {
      jest.spyOn(Post, 'destroy').mockRejectedValue(new Error(DATABASE_ERROR));
      const response = await request(app)
        .delete(API_ENDPOINTS.POSTS);

      expect(response.status).toBe(STATUS_CODE.INTERNAL_SERVER_ERROR);
      expect(response.body.message).toBe(DATABASE_ERROR);
    });
  });

  describe('Delete user\'s post by ID', () => {
    beforeEach(async() => {
      await Post.destroy({ where: {} });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    app.delete(`${API_ENDPOINTS.USERS_POST_ID}`, authMiddleware.validateToken(), postController.deleteUsersPostById);

    // Middleware handle error
    app.use((err: HttpExceptionError, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message });
    });

    it('Should delete user\'s post by ID', async () => {
      const post = MOCKS_POSTS[0];
      jest.spyOn(Post, 'findOne').mockResolvedValue({ ...post} as any);
      jest.spyOn(Post, 'destroy').mockResolvedValue(1);

      const response = await request(app)
        .delete(`${API_ENDPOINTS.USERS_POST_ID}`.replace(':userId', '1').replace(':id', post.id.toString()))
        .set('Authorization', `Bearer ${jwt.encode({ userId: 1 }, 'secret')}`);

      expect(response.status).toBe(STATUS_CODE.NO_CONTENT);
    });

    it('Should return error when post not found', async () => {
      jest.spyOn(Post, 'findOne').mockResolvedValue(null);
      const response = await request(app)
        .delete(`${API_ENDPOINTS.USERS_POST_ID}`.replace(':userId', '1').replace(':id', '999'))
        .set('Authorization', `Bearer ${jwt.encode({ userId: 1 }, 'secret')}`);

      expect(response.status).toBe(STATUS_CODE.NOT_FOUND);
      expect(response.body.message).toBe(MESSAGES.ERRORS.POST.NOT_FOUND);
    });

    it('Should return error when user is not authorized to delete post', async () => {
      const post = MOCKS_POSTS[0];
      const errorMessage = "Database error";
      const error = new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, errorMessage);
      jest.spyOn(Post, 'findOne').mockResolvedValue({ ...post} as any);
      jest.spyOn(Post, 'destroy').mockRejectedValue(error);
      const response = await request(app)
        .delete(`${API_ENDPOINTS.USERS_POST_ID}`.replace(':userId', '2').replace(':id', post.id.toString()))
        .set('Authorization', `Bearer ${jwt.encode({ userId: 1 }, 'secret')}`);
      expect(response.status).toBe(STATUS_CODE.INTERNAL_SERVER_ERROR);
      expect(response.body.message).toBe(errorMessage);
    });

    it('Should return error when delete user\'s post fails', async () => {
      const express = require('express');
      const testApp = express();
    
      // Middleware mock validateToken
      testApp.delete(API_ENDPOINTS.USERS_POST_ID, 
        (req: any, _res: any, next: any) => {
          req.userId = 1;
          req.isAdmin = false;
          next();
        }, 
        postController.deleteUsersPostById
      );
    
      jest.spyOn(Post, 'findOne').mockResolvedValue(MOCKS_POSTS[0] as any);
    
      const response = await request(testApp)
        .delete(`${API_ENDPOINTS.USERS_POST_ID}`
          .replace(':userId', '2')
          .replace(':id', MOCKS_POSTS[0].id.toString())
        );
    
      expect(response.status).toBe(STATUS_CODE.FORBIDDEN);
    });
  });
});