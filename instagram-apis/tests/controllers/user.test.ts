// libs
import 'jest';
import express, { NextFunction, Request, Response, Express } from 'express';
import bodyParser from 'body-parser';
import request from 'supertest';

import { sequelize } from "@/configs";
import { userController } from "@/controllers";
import { API_ENDPOINTS, MESSAGES_AUTHENTICATION, STATUS_CODE, PAGINATION, MESSAGES } from '@/constants';
import HttpExceptionError from '@/exceptions';
import { USER_PAYLOAD, LIST_USERS } from '@/mocks';
import { Post, User, Comment } from '@/models';
import { userServices } from '@/services';
import { RequestAuthenticationType } from '@/types';

jest.mock('@/middlewares/auth.middleware', () => ({
  validateToken: () => (req: RequestAuthenticationType, _res: Response, next: NextFunction) => {
    req.userId = 1;
    req.isAdmin = true;
    next();
  },
}));

const app: Express = express();
app.use(bodyParser.json());

const { DEFAULT: { LIMIT, OFFSET } } = PAGINATION;
const seededUserId = 1;
const DATABASE_ERROR = 'Database error';

describe('Users controller', () => {
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
  
  describe('Users: get all users', () => {
    app.get(API_ENDPOINTS.USERS, userController.getAll);

    // Middleware handle error
    app.use((err: HttpExceptionError, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message });
    });

    it('Should get all users: get users', async () => {
      jest.spyOn(User, 'findAndCountAll').mockResolvedValueOnce({
        rows: LIST_USERS,
        count: LIST_USERS.length
      } as any);

      const response = await request(app)
        .get(API_ENDPOINTS.USERS)
        .query({
          limit: LIMIT,
          offset: OFFSET
        });

      const { status, body } = response;
      expect(status).toBe(STATUS_CODE.OK);
      expect(body.data).toEqual({
        data: LIST_USERS,
        meta: {
          pagination: {
            limit: LIMIT,
            offset: OFFSET,
            total: LIST_USERS.length,
          }
        }
      });
      expect(body.data?.data[0]).not.toHaveProperty("password");
    });

    it('Should return error server error', async () => {
      const error = new HttpExceptionError(
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        MESSAGES_AUTHENTICATION.INTERNAL_SERVER_ERROR
      );
      jest.spyOn(User, 'findAndCountAll').mockRejectedValue(error);
      const response = await request(app)
        .get(API_ENDPOINTS.USERS)
        .query({
          limit: LIMIT,
          offset: OFFSET
        });
      expect(response.status).toBe(STATUS_CODE.INTERNAL_SERVER_ERROR);
      expect(response.body.message).toBe(MESSAGES_AUTHENTICATION.INTERNAL_SERVER_ERROR);
    });
  });

  describe('Users: get user by id ', () => {
    app.get(`${API_ENDPOINTS.USERS}/:userId`, userController.getUserById);

    // Middleware handle error
    app.use((err: HttpExceptionError, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message });
    });
    it('Should get user by id: get user', async () => {
      const user = LIST_USERS[0];
      jest.spyOn(User, 'findByPk').mockResolvedValue({
        ...user,
        toJSON: () => (user),
      } as any);
      const response = await request(app)
        .get(`${API_ENDPOINTS.USERS}/${seededUserId}`);

      const { status, body } = response;
      expect(status).toBe(STATUS_CODE.OK);
      expect(body.data).toEqual(user)  ;
      expect(body.data).not.toHaveProperty("password");
    });

    it('Should return error: user not found', async () => {
      jest.spyOn(User, 'findByPk').mockResolvedValue(null);
      const response = await request(app)
        .get(`${API_ENDPOINTS.USERS}/${seededUserId}`);

      expect(response.status).toBe(STATUS_CODE.NOT_FOUND);
      expect(response.body.message).toBe(MESSAGES_AUTHENTICATION.USER_NOT_FOUND);
    });

    it('Get user by ID - should return error: server error', async () => {
      const error = new HttpExceptionError(
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        MESSAGES_AUTHENTICATION.INTERNAL_SERVER_ERROR
      );
      jest.spyOn(User, 'findByPk').mockRejectedValue(error);

      const response = await request(app)
        .get(`${API_ENDPOINTS.USERS}/${seededUserId}`);

      expect(response.status).toBe(STATUS_CODE.INTERNAL_SERVER_ERROR);
      expect(response.body.message).toBe(MESSAGES_AUTHENTICATION.INTERNAL_SERVER_ERROR);
    });
  });

  describe('Users: update user', () => {
    app.put(`${API_ENDPOINTS.USERS}`, userController.updateUsers);

    // Middleware handle error
    app.use((err: HttpExceptionError, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message });
    });

    it('Should update users: update list users', async () => {
      const newEmail = 'emailUpdate@gmail.com';
      const users = LIST_USERS.map(user => ({ ...user, email: newEmail }));
      jest.spyOn(User, 'findAll').mockResolvedValue([]);
      jest.spyOn(User, 'update').mockResolvedValue([1] as any);
      jest.spyOn(User, 'findOne').mockResolvedValue(users as any);
      const response = await request(app)
        .put(API_ENDPOINTS.USERS)
        .send({
          users
        });
      const { status, body } = response;
      expect(status).toBe(STATUS_CODE.OK);
      expect(body.message).toBe(MESSAGES.SUCCESS.UPDATE);
      expect(body.data).toEqual([users]);
    });

    it('Should return error: duplicate email in payload', async () => {
      const response = await request(app)
        .put(API_ENDPOINTS.USERS)
        .send({
          users: [
            USER_PAYLOAD,
            USER_PAYLOAD
          ]
        });
      expect(response.status).toBe(STATUS_CODE.BAD_REQUEST);
      expect(response.body.message).toBe("Duplicate email in user' payload");
    });

    it('Should return error: duplicate email in data', async () => {
      jest.spyOn(User, "findAll").mockResolvedValueOnce([
        {
          ...LIST_USERS[0],
          email: "a@gmail.com"
        }
      ] as any);
      const response = await request(app)
        .put(API_ENDPOINTS.USERS)
        .send({
          users: [
            { ...USER_PAYLOAD, email: "a@gmail.com", userId: 2 }
          ]
        });
      expect(response.status).toBe(STATUS_CODE.BAD_REQUEST);
      expect(response.body.message).toBe("Some emails already exist");
    });

    it('Should return server error when get duplicate email in data', async () => {
      const error = new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, DATABASE_ERROR);
      jest.spyOn(User, "findAll").mockRejectedValue(error);
      const response = await request(app)
        .put(API_ENDPOINTS.USERS)
        .send({
          users: [
            { ...USER_PAYLOAD, email: "a@gmail.com", userId: 2 }
          ]
        });
        expect(response.status).toBe(STATUS_CODE.INTERNAL_SERVER_ERROR);
        expect(response.body.message).toBe(DATABASE_ERROR);
    });

    it('Should return error: no users found', async () => {
      jest.spyOn(User, 'findAll').mockResolvedValue([]);
      jest.spyOn(User, 'update').mockResolvedValue([0] as any);
      const response = await request(app)
        .put(API_ENDPOINTS.USERS)
        .send({
          users: [
            { ...USER_PAYLOAD, userId: seededUserId }
          ]
        });

      expect(response.status).toBe(STATUS_CODE.NOT_FOUND);
      expect(response.body.message).toBe(MESSAGES.NOT_FOUND);
    });

    it('Update list user - should return error: server error', async () => {
      const error = new HttpExceptionError(
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        MESSAGES_AUTHENTICATION.INTERNAL_SERVER_ERROR
      );
      jest.spyOn(User, 'update').mockRejectedValue(error);

      const response = await request(app)
        .put(API_ENDPOINTS.USERS)
        .send({
          users: [
            { ...USER_PAYLOAD, userId: seededUserId }
          ]
        });

      expect(response.status).toBe(STATUS_CODE.INTERNAL_SERVER_ERROR);
      expect(response.body.message).toBe(MESSAGES_AUTHENTICATION.INTERNAL_SERVER_ERROR);
    });
  });

  describe('Users: update user by id', () => {
    app.put(`${API_ENDPOINTS.USERS}/:userId`, userController.updateUserById);

    // Middleware handle error
    app.use((err: HttpExceptionError, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message });
    });

    it('Should update user by id: update user', async () => {
      const payload = { username: 'Admin', email: 'a@gmail.com', isAdmin: true };
      const user = { ...LIST_USERS[0], ...payload };
      jest.spyOn(User, 'findOne').mockResolvedValue(null);
      jest.spyOn(User, 'update').mockResolvedValue([1] as any);
      jest.spyOn(User, 'findByPk').mockResolvedValue({
        ...user,
        toJSON: () => (user),
      } as any);
      const response = await request(app)
        .put(`${API_ENDPOINTS.USERS}/${seededUserId}`)
        .send(payload);
      const { status, body } = response;
      expect(status).toBe(STATUS_CODE.OK);
      expect(body.message).toBe(MESSAGES.SUCCESS.UPDATE);
      expect(body.data).toEqual(user);
    });

    it('Should return error: email already exists', async () => {
      const existingEmail = 'a@gmail.com';
      jest.spyOn(User, 'findOne').mockResolvedValue({
        toJSON() {
          return LIST_USERS[0];
        }
      } as any);
      const response = await request(app)
        .put(`${API_ENDPOINTS.USERS}/${seededUserId}`)
        .send({ username: 'Admin', email: existingEmail });
      expect(response.status).toBe(STATUS_CODE.BAD_REQUEST);
      expect(response.body.message).toBe(`Email ${existingEmail} existing`);
    });

    it('Should return server error when check email existing', async() => {
      const existingEmail = 'a@gmail.com';
      const error = new HttpExceptionError(STATUS_CODE.INTERNAL_SERVER_ERROR, DATABASE_ERROR);
      jest.spyOn(User, 'findOne').mockRejectedValue(error);

      const response = await request(app)
        .put(`${API_ENDPOINTS.USERS}/${seededUserId}`)
        .send({ username: 'Admin', email: existingEmail });

      expect(response.status).toBe(STATUS_CODE.INTERNAL_SERVER_ERROR);
      expect(response.body.message).toBe(DATABASE_ERROR);
    });

    it('Should return error: user not found', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(null);
      jest.spyOn(User, 'update').mockResolvedValue([0] as any);
      const response = await request(app)
        .put(`${API_ENDPOINTS.USERS}/${seededUserId}`)
        .send({ username: 'Admin' });

      expect(response.status).toBe(STATUS_CODE.NOT_FOUND);
      expect(response.body.message).toBe(MESSAGES_AUTHENTICATION.USER_NOT_FOUND);
    });

    it('Update user by ID - should return error: server error', async () => {
      const error = new HttpExceptionError(
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        MESSAGES_AUTHENTICATION.INTERNAL_SERVER_ERROR
      );
      jest.spyOn(User, 'update').mockRejectedValue(error);

      const response = await request(app)
        .put(`${API_ENDPOINTS.USERS}/${seededUserId}`)
        .send({ username: 'Admin' });

      expect(response.status).toBe(STATUS_CODE.INTERNAL_SERVER_ERROR);
      expect(response.body.message).toBe(MESSAGES_AUTHENTICATION.INTERNAL_SERVER_ERROR);
    });
  });

  describe('Users: delete user by id', () => {
    app.delete(`${API_ENDPOINTS.USERS}/:userId`, userController.deleteUserById);

    // Middleware handle error
    app.use((err: HttpExceptionError, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message });
    });

    it('Should delete user by id: delete user', async () => {
      jest.spyOn(User, 'destroy').mockResolvedValue(1 as any);
      const response = await request(app)
        .delete(`${API_ENDPOINTS.USERS}/${seededUserId}`);

      expect(response.status).toBe(STATUS_CODE.OK);
      expect(response.body.message).toBe(MESSAGES.SUCCESS.DELETE);
    });
    
    it('Should return error: user not found', async () => {
      jest.spyOn(User, 'destroy').mockResolvedValue(0 as any);
      const response = await request(app)
        .delete(`${API_ENDPOINTS.USERS}/${seededUserId}`);

      expect(response.status).toBe(STATUS_CODE.NOT_FOUND);
      expect(response.body.message).toBe(MESSAGES_AUTHENTICATION.USER_NOT_FOUND);
    });
  });

  describe('Users: delete users', () => {
    app.delete(API_ENDPOINTS.USERS, userController.deleteUsers);

    // Middleware handle error
    app.use((err: HttpExceptionError, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message });
    });

    it('Should delete all users', async () => {
      jest.spyOn(Comment, 'destroy').mockResolvedValue(1 as any);
      jest.spyOn(Post, 'destroy').mockResolvedValue(1 as any);
      jest.spyOn(User, 'destroy').mockResolvedValue(1 as any);
      const response = await request(app)
        .delete(API_ENDPOINTS.USERS);

      expect(response.status).toBe(STATUS_CODE.OK);
      expect(response.body.message).toBe(MESSAGES.SUCCESS.DELETE);
    });

    it('Delete user - should return error: server error', async () => {
      const error = new HttpExceptionError(
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        MESSAGES_AUTHENTICATION.INTERNAL_SERVER_ERROR
      );
      jest.spyOn(userServices, 'deleteUsers').mockRejectedValue(error);

      const response = await request(app)
        .delete(API_ENDPOINTS.USERS);

      expect(response.status).toBe(STATUS_CODE.INTERNAL_SERVER_ERROR);
      expect(response.body.message).toBe(MESSAGES_AUTHENTICATION.INTERNAL_SERVER_ERROR);
    });
  });
});
