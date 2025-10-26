// libs
import 'jest';
import bcrypt from "bcrypt";
import express, { NextFunction, Request, Response, Express } from 'express';
import bodyParser from 'body-parser';
import request from 'supertest';

import { sequelize } from "@/configs";
import { authenticationController } from "@/controllers";
import { API_ENDPOINTS, MESSAGES_AUTHENTICATION, STATUS_CODE } from '@/constants';
import HttpExceptionError from '@/exceptions';
import { LIST_USERS, USER_PAYLOAD, USER_PAYLOAD_LOGIN } from '@/mocks';
import { User } from '@/models';

jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('hashed_password'),
  genSalt: jest.fn().mockResolvedValue('fake_salt')
}));

const app: Express = express();
app.use(bodyParser.json());

describe('Authentication controller', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await sequelize.close();
  });
  
  describe('Authentication: User register', () => {
    beforeEach(async () => {
      await User.destroy({ where: {} });
      await User.create({
        ...LIST_USERS[0],
        password: 'hashed_password'
      });
    });
    app.post(API_ENDPOINTS.REGISTER, authenticationController.register);

    // Middleware handle error
    app.use((err: HttpExceptionError, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.status || 500).json({ message: err.message });
    });

    it('Should user register: create a user', async () => {
      jest.spyOn(User, 'create').mockResolvedValue({
        toJSON() {
          return LIST_USERS[0];
        }
      } as any);
      const response = await request(app)
        .post(API_ENDPOINTS.REGISTER)
        .send({ ...USER_PAYLOAD, email: 'usera@gmail.com' });

      expect(response.status).toBe(STATUS_CODE.CREATED);
      expect(response.body.data).toHaveProperty("email", "user@gm.com");
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('Should return error: user is existed', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue({
        toJSON() {
          return LIST_USERS[0];
        }
      } as any);
      const response = await request(app)
        .post(API_ENDPOINTS.REGISTER)
        .send({ ...USER_PAYLOAD, email: 'user@gm.com' });

      expect(response.status).toBe(STATUS_CODE.CONFLICT);
      expect(response.body.message).toBe(MESSAGES_AUTHENTICATION.EXIST_USER);
    });

    it('Register should return error: server error', async () => {
      const error = new HttpExceptionError(
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        MESSAGES_AUTHENTICATION.INTERNAL_SERVER_ERROR
      );

      jest.mock('jwt-simple', () => ({
        encode: jest.fn().mockReturnValue('fake_token')
      }));

      jest.spyOn(User, 'findOne').mockResolvedValue(null);
      jest.spyOn(User, 'create').mockRejectedValue(error);

      const response = await request(app)
        .post(API_ENDPOINTS.REGISTER)
        .send({
          username: 'user1',
          email: 'user1@gmail.com',
          password: 'Abc@12345',
          isAdmin: false
        });

      expect(response.status).toBe(STATUS_CODE.INTERNAL_SERVER_ERROR);
      expect(response.body.message).toBe(MESSAGES_AUTHENTICATION.INTERNAL_SERVER_ERROR);
    });
  });

  app.post(API_ENDPOINTS.LOGIN, authenticationController.login);

  // Middleware handle error
  app.use((err: HttpExceptionError, _req: Request, res: Response, _next: NextFunction) => {
    res.status(err.status || 500).json({ message: err.message });
  });

  describe('Authentication: User login', () => {
    const mockUserInstance = {
      toJSON: () => ({
        userId: 2,
        email: 'usera@gmail.com',
        username: 'lintran',
        password: '$2b$10$abcdefghijk....',
        isAdmin: false
      })
    } as any;

    beforeEach(() => {
      jest.clearAllMocks();
  });

    it('Should user login: user login', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(mockUserInstance);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      jest.mock('jwt-simple', () => ({
        encode: jest.fn().mockReturnValue('fake_token')
      }));

      const response = await request(app)
        .post(API_ENDPOINTS.LOGIN)
        .send(USER_PAYLOAD_LOGIN);

      expect(response.status).toBe(STATUS_CODE.OK);
      expect(response.body.data).toHaveProperty("email", "usera@gmail.com");
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('Should return error: user not found', async () => {
      jest.spyOn(User, 'findOne').mockResolvedValue(null);
      const response = await request(app)
        .post(API_ENDPOINTS.LOGIN)
        .send({
          ...USER_PAYLOAD,
          email: 'user1@gmail.com'
        });

      expect(response.status).toBe(STATUS_CODE.UNAUTHORIZED);
      expect(response.body.message).toBe(MESSAGES_AUTHENTICATION.INVALID_EMAIL_PASSWORD);
    });

    it('Login should return error: server error', async () => {
      const error = new HttpExceptionError(
        STATUS_CODE.INTERNAL_SERVER_ERROR,
        MESSAGES_AUTHENTICATION.INTERNAL_SERVER_ERROR
      );
      jest.spyOn(User, 'findOne').mockRejectedValue(error);

      const response = await request(app)
        .post(API_ENDPOINTS.LOGIN)
        .send(USER_PAYLOAD_LOGIN);

      expect(response.status).toBe(STATUS_CODE.INTERNAL_SERVER_ERROR);
      expect(response.body.message).toBe(MESSAGES_AUTHENTICATION.INTERNAL_SERVER_ERROR);
    });

    it('Should return null when password is invalid', async () => {
      // Mock a found user
      jest.spyOn(User, 'findOne').mockResolvedValue({
        toJSON: () => ({
          userId: 2,
          email: 'usera@gmail.com',
          username: 'lintran',
          password: 'hashed_password',
          isAdmin: false
        })
      } as any);
    
      // Mock compare to fail
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    
      const response = await request(app)
        .post(API_ENDPOINTS.LOGIN)
        .send(USER_PAYLOAD_LOGIN);
    
      // Since your login controller should return null => Unauthorized
      expect(response.status).toBe(STATUS_CODE.UNAUTHORIZED);
      expect(response.body.message).toBe(MESSAGES_AUTHENTICATION.INVALID_EMAIL_PASSWORD);
    });
  });
});
