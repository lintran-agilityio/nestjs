// Libs
import { Test, TestingModule } from '@nestjs/testing';

// Local sources
import { UserController } from './users.controller';
import { UserService } from './users.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: any;

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
    const result = await controller.getUsers({} as any);
    expect(userService.getAll).toHaveBeenCalled();
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('getById should delegate', async () => {
    userService.getById.mockResolvedValue({ id: 'u1' });
    const result = await controller.getById('u1' as any);
    expect(userService.getById).toHaveBeenCalledWith('u1');
    expect(result).toEqual({ id: 'u1' });
  });

  it('getByEmail should delegate', async () => {
    userService.getByEmail.mockResolvedValue({ id: 'u1', email: 'e' });
    const result = await controller.getByEmail('e');
    expect(userService.getByEmail).toHaveBeenCalledWith('e');
    expect(result).toEqual({ id: 'u1', email: 'e' });
  });

  it('update should delegate', async () => {
    userService.updateById.mockResolvedValue({ message: 'ok' });
    const result = await controller.update('u1' as any, { firstName: 'a' } as any);
    expect(userService.updateById).toHaveBeenCalledWith('u1', { firstName: 'a' });
    expect(result).toEqual({ message: 'ok' });
  });

  it('updateAll should delegate', async () => {
    userService.updateAll.mockResolvedValue([]);
    const result = await controller.updateAll({ users: [] } as any);
    expect(userService.updateAll).toHaveBeenCalledWith({ users: [] });
    expect(result).toEqual([]);
  });

  it('deleteAll should delegate', async () => {
    userService.deleteAll.mockResolvedValue({ message: 'ok', count: 0 });
    const result = await controller.deleteAll();
    expect(userService.deleteAll).toHaveBeenCalled();
    expect(result).toEqual({ message: 'ok', count: 0 });
  });

  it('deleteById should delegate', async () => {
    userService.deleteById.mockResolvedValue({ message: 'ok' });
    const result = await controller.deleteById('u1' as any);
    expect(userService.deleteById).toHaveBeenCalledWith('u1');
    expect(result).toEqual({ message: 'ok' });
  });

  it('deletePostById should delegate', async () => {
    userService.deletePostById.mockResolvedValue({ message: 'ok' });
    const result = await controller.deletePostById('u1' as any, 'p1' as any);
    expect(userService.deletePostById).toHaveBeenCalledWith('u1', 'p1');
    expect(result).toEqual({ message: 'ok' });
  });
});
