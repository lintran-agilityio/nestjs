// Libs
import { Test, TestingModule } from '@nestjs/testing';

// Local sources
import { UserController } from './users.controller';
import { UserService } from './users.service';
import {
  mockingPostUuid,
  mockingUserInfo,
  mockUuidUser,
} from '@app/shared/mocks';

describe('UserController', () => {
  let controller: UserController;
  let userService;
  const messageSuccess = 'ok';

  beforeEach(async () => {
    userService = {
      getAll: jest.fn(),
      getById: jest.fn(),
      getByEmail: jest.fn(),
      updateById: jest.fn(),
      updateAll: jest.fn(),
      deleteAll: jest.fn(),
      deleteById: jest.fn(),
      deletePostById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: userService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getUsers should delegate', async () => {
    userService.getAll.mockResolvedValue({ data: [], total: 0 });
    const result = await controller.getUsers({});
    expect(userService.getAll).toHaveBeenCalled();
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('getById should delegate', async () => {
    userService.getById.mockResolvedValue({ id: mockUuidUser });
    const result = await controller.getById(mockUuidUser);
    expect(userService.getById).toHaveBeenCalledWith(mockUuidUser);
    expect(result).toEqual({ id: mockUuidUser });
  });

  it('getByEmail should delegate', async () => {
    const mockingResponse = { id: mockUuidUser, email: mockingUserInfo.email };
    userService.getByEmail.mockResolvedValue(mockingResponse);
    const result = await controller.getByEmail(mockingUserInfo.email);
    expect(userService.getByEmail).toHaveBeenCalledWith(mockingUserInfo.email);
    expect(result).toEqual(mockingResponse);
  });

  it('update should delegate', async () => {
    userService.updateById.mockResolvedValue({ message: messageSuccess });
    const result = await controller.update(mockUuidUser, { firstName: 'a' });
    expect(userService.updateById).toHaveBeenCalledWith(mockUuidUser, {
      firstName: 'a',
    });
    expect(result).toEqual({ message: messageSuccess });
  });

  it('updateAll should delegate', async () => {
    userService.updateAll.mockResolvedValue([]);
    const result = await controller.updateAll({ users: [] });
    expect(userService.updateAll).toHaveBeenCalledWith({ users: [] });
    expect(result).toEqual([]);
  });

  it('deleteAll should delegate', async () => {
    userService.deleteAll.mockResolvedValue({
      message: messageSuccess,
      count: 0,
    });
    const result = await controller.deleteAll();
    expect(userService.deleteAll).toHaveBeenCalled();
    expect(result).toEqual({ message: messageSuccess, count: 0 });
  });

  it('deleteById should delegate', async () => {
    userService.deleteById.mockResolvedValue({ message: messageSuccess });
    const result = await controller.deleteById(mockUuidUser);
    expect(userService.deleteById).toHaveBeenCalledWith(mockUuidUser);
    expect(result).toEqual({ message: messageSuccess });
  });

  it('deletePostById should delegate', async () => {
    userService.deletePostById.mockResolvedValue({ message: messageSuccess });
    const result = await controller.deletePostById(
      mockUuidUser,
      mockingPostUuid,
    );
    expect(userService.deletePostById).toHaveBeenCalledWith(
      mockUuidUser,
      mockingPostUuid,
    );
    expect(result).toEqual({ message: messageSuccess });
  });
});
