// Libs
import { Test, TestingModule } from '@nestjs/testing';

// Local sources
import { PostController } from './posts.controller';
import { PostService } from './posts.service';

describe('PostController', () => {
  let controller: PostController;
  let postService: {
    getAll: jest.Mock;
    getById: jest.Mock;
    create: jest.Mock;
    updateById: jest.Mock;
    deleteById: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    postService = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [
        { provide: PostService, useValue: postService },
      ],
    }).compile();

    controller = module.get<PostController>(PostController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getAll should delegate to service', async () => {
    postService.getAll.mockResolvedValue({ data: [], total: 0 });
    const result = await controller.getAll({} as any);
    expect(postService.getAll).toHaveBeenCalled();
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('get should delegate to service', async () => {
    postService.getById.mockResolvedValue({ id: 'p1' });
    const result = await controller.get('p1' as any);
    expect(postService.getById).toHaveBeenCalledWith('p1');
    expect(result).toEqual({ id: 'p1' });
  });

  it('create should delegate to service', async () => {
    postService.create.mockResolvedValue({ id: 'p1' });
    const result = await controller.create({ id: 'u1' } as any, { title: 't', contents: 'c', slug: 's' } as any);
    expect(postService.create).toHaveBeenCalledWith('u1', { title: 't', contents: 'c', slug: 's' });
    expect(result).toEqual({ id: 'p1' });
  });

  it('updateById should delegate to service', async () => {
    postService.updateById.mockResolvedValue({ id: 'p1', title: 'new' });
    const result = await controller.updateById('p1' as any, { title: 'new', contents: 'c' } as any);
    expect(postService.updateById).toHaveBeenCalledWith('p1', { title: 'new', contents: 'c' });
    expect(result).toEqual({ id: 'p1', title: 'new' });
  });

  it('deleteById should delegate to service', async () => {
    postService.deleteById.mockResolvedValue({ message: 'ok' });
    const result = await controller.deleteById('p1' as any);
    expect(postService.deleteById).toHaveBeenCalledWith('p1');
    expect(result).toEqual({ message: 'ok' });
  });

  it('deleteUserPosts should delegate to service', async () => {
    postService.delete.mockResolvedValue({ message: 'ok', count: 1 });
    const result = await controller.deleteUserPosts({ postIds: ['p1'] } as any);
    expect(postService.delete).toHaveBeenCalledWith({ postIds: ['p1'] });
    expect(result).toEqual({ message: 'ok', count: 1 });
  });
});
