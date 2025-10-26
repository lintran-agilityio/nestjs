// libs
import { SuperTest, Test } from "supertest";

import { API_ENDPOINTS, STATUS_CODE, MESSAGES } from "@/constants";
import { userRouter } from "@/routes/users.route";
import { userController } from "@/controllers/user.controller";

const { UPDATE, ADD, DELETE } = MESSAGES.SUCCESS;
const mockingUsers = [
  {
    "userId": 7,
    "email": "abc@gmail.com",
    "username": "admin",
    "isAdmin": 1,
    "createdAt": "2025-08-04 04:21:23.603 +00:00",
    "updatedAt": "2025-08-04 04:21:23.603 +00:00"
  }
];

jest.mock('@/middlewares/validate-request.middleware', () => ({
  __esModule: true,
  validateRequest: jest.fn(() => (req: any, res: any, next: any) => next())
}));

jest.mock('@/controllers/user.controller', () => ({
  userController: {
    getAll: jest.fn((_req, res) => res.status(STATUS_CODE.OK).json({ message: ADD, data: mockingUsers })),
    getUserById: jest.fn((_req, res) => res.status(STATUS_CODE.OK).json({ message: ADD, data: mockingUsers[0] })),
    updateUserById: jest.fn((_req, res) => res.status(STATUS_CODE.NO_CONTENT).json({ message: UPDATE })),
    updateUsers: jest.fn((_req, res) => res.status(STATUS_CODE.NO_CONTENT).json({ message: UPDATE })),
    deleteUserById: jest.fn((_req, res) => res.status(STATUS_CODE.NO_CONTENT).json({ message: DELETE })),
    deleteUsers: jest.fn((_req, res) => res.status(STATUS_CODE.OK).json({ message: DELETE })),
  }
}))

let app: any;
let requestApp: SuperTest<Test>;

describe('User routes for success', () => {
  beforeAll(async () => {
    const express = require('express');


    app = express();
    app.use(express.json());
    userRouter(app);
    requestApp = require('supertest')(app);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it(`GET: ${API_ENDPOINTS.USERS} success`, async () => {
    const res = await requestApp.get(API_ENDPOINTS.USERS);

    expect(userController.getAll).toHaveBeenCalled();
    expect(res.status).toBe(STATUS_CODE.OK);
    expect(res.body.message).toBe(ADD);
    expect(res.body.data).toStrictEqual(mockingUsers);
  });

  it(`GET ${API_ENDPOINTS.USER_BY_ID} success`, async () => {
    const res = await requestApp.get(API_ENDPOINTS.USER_BY_ID);

    expect(userController.getUserById).toHaveBeenCalled();
    expect(res.status).toBe(STATUS_CODE.OK);
    expect(res.body.message).toBe(ADD);
    expect(res.body.data).toStrictEqual(mockingUsers[0]);
  });

  it(`PUT ${API_ENDPOINTS.USER_BY_ID} success`, async () => {
    const res = await requestApp
      .put(API_ENDPOINTS.USER_BY_ID)
      .send({ username: "abc" });

    expect(userController.getUserById).toHaveBeenCalled();
    expect(res.status).toBe(STATUS_CODE.NO_CONTENT);
  });

  it(`PUT ${API_ENDPOINTS.USERS} success`, async () => {
    const res = await requestApp
      .put(API_ENDPOINTS.USERS)
      .send({ email: "abc@gmail.com" })

    expect(userController.getUserById).toHaveBeenCalled();
    expect(res.status).toBe(STATUS_CODE.NO_CONTENT);
  });

  it(`DELETE ${API_ENDPOINTS.USERS} success`, async () => {
    const res = await requestApp.delete(API_ENDPOINTS.USERS);

    expect(userController.deleteUsers).toHaveBeenCalled();
    expect(res.status).toBe(STATUS_CODE.OK);
    expect(res.body.message).toBe(MESSAGES.SUCCESS.DELETE)
  });

  it(`DELETE ${API_ENDPOINTS.USER_BY_ID} success`, async () => {
    const res = await requestApp.delete(API_ENDPOINTS.USER_BY_ID);

    expect(userController.deleteUserById).toHaveBeenCalled();
    expect(res.status).toBe(STATUS_CODE.NO_CONTENT);
  });
});