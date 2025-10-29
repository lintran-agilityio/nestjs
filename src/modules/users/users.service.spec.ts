// Libs
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

// App sources
import { CUSTOM_PROVIDER_TOKENS } from '@app/shared/common';
import { PostService } from '@app/modules/posts/posts.service';
import { MESSAGES } from '@app/shared/constants';
import {
  createMockLoggerProvider,
  createRepositoryProvider,
  MOCKING_TOKEN,
  mockingPostUuid,
  mockingUserInfo,
  mockingUserRegister,
  mockingUserResponse,
  mockUuidUser,
} from '@app/shared/mocks';

// Local sources
import { UserService } from './users.service';
import { User } from './entities';
import { UpdateAllUsersDto } from './dtos';

describe('UserService', () => {
  let service: UserService;
  let usersRepo: jest.Mocked<Repository<User>>;
  let postService: { deleteUserPostById: jest.Mock };
  let hashing: { hash: jest.Mock; compare: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        createRepositoryProvider<User>(User, {
          findOne: jest.fn(),
          find: jest.fn(),
          update: jest.fn(),
          remove: jest.fn(),
          save: jest.fn(),
          merge: jest.fn(),
          createQueryBuilder: jest.fn().mockReturnValue({
            delete: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue({ affected: 0 }),
          }),
        }),
        {
          provide: CUSTOM_PROVIDER_TOKENS.PASSWORD_HASHING_SERVICE,
          useValue: { hash: jest.fn(), compare: jest.fn() },
        },
        createMockLoggerProvider(),
        {
          provide: PostService,
          useValue: { deleteUserPostById: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    usersRepo = module.get(getRepositoryToken(User));
    postService = module.get(PostService);
    hashing = module.get(CUSTOM_PROVIDER_TOKENS.PASSWORD_HASHING_SERVICE);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getById', () => {
    it('throws NotFound when user missing', async () => {
      (usersRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.getById('id-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns user when exists', async () => {
      (usersRepo.findOne as jest.Mock).mockResolvedValue(mockingUserResponse);
      await expect(service.getById(mockUuidUser)).resolves.toBe(
        mockingUserResponse,
      );
    });
  });

  describe('getByEmail', () => {
    it('throws NotFound when missing', async () => {
      (usersRepo.findOne as jest.Mock).mockResolvedValue(null);
      await expect(
        service.getByEmail(mockingUserInfo.email),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateRefreshToken', () => {
    it('updates refresh token', async () => {
      (usersRepo.update as jest.Mock).mockResolvedValue(undefined);
      await service.updateRefreshToken(mockUuidUser, MOCKING_TOKEN);
      expect(usersRepo.update).toHaveBeenCalledWith(mockUuidUser, {
        refreshToken: MOCKING_TOKEN,
      });
    });
  });

  describe('updateAll', () => {
    it('hashes password and saves each user', async () => {
      jest.spyOn(service, 'getById').mockResolvedValue(mockingUserRegister);
      hashing.hash.mockResolvedValue('hashed');
      (usersRepo.merge as jest.Mock).mockImplementation((e, d) => ({
        ...e,
        ...d,
      }));
      (usersRepo.save as jest.Mock).mockResolvedValue({ id: mockUuidUser });

      const result = await service.updateAll({
        users: [{ id: mockUuidUser, password: 'x' }],
      } as UpdateAllUsersDto);

      expect(hashing.hash).toHaveBeenCalledWith('x');
      expect(result).toEqual([{ id: mockUuidUser }]);
    });
  });

  describe('updateById', () => {
    it('hashes password conditionally and updates', async () => {
      jest
        .spyOn(service, 'getById')
        .mockResolvedValue({ id: mockUuidUser, password: 'old' });
      hashing.hash.mockResolvedValue('hashed');
      (usersRepo.update as jest.Mock).mockResolvedValue(undefined);

      const result = await service.updateById('u1', { password: 'new' });

      expect(hashing.hash).toHaveBeenCalledWith('new');
      expect(usersRepo.update).toHaveBeenCalled();
      expect(result).toEqual({
        message: `User id - ${mockUuidUser} updated successfully`,
      });
    });
  });

  describe('deleteAll', () => {
    it('throws when nothing to delete', async () => {
      (usersRepo.find as jest.Mock).mockResolvedValue([]);
      await expect(service.deleteAll()).rejects.toThrow('No users for delete');
    });

    it('returns message and count when deleted', async () => {
      (usersRepo.find as jest.Mock).mockResolvedValue([{ id: mockUuidUser }]);
      (usersRepo.createQueryBuilder as jest.Mock).mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 2 }),
      });

      const result = await service.deleteAll();
      expect(result).toEqual({
        message: 'Deleted 2 users successfully.',
        count: 2,
      });
    });
  });

  describe('deleteById', () => {
    it('removes the user', async () => {
      jest.spyOn(service, 'getById').mockResolvedValue({ id: mockUuidUser });
      (usersRepo.remove as jest.Mock).mockResolvedValue(undefined);
      const result = await service.deleteById('u1');
      expect(usersRepo.remove).toHaveBeenCalled();
      expect(result).toEqual({ message: MESSAGES.USER_DELETE_SUCCESS });
    });
  });

  describe('deletePostById', () => {
    it('delegates to PostService', async () => {
      postService.deleteUserPostById.mockResolvedValue({ message: 'ok' });
      const result = await service.deletePostById('u1', 'p1');
      expect(postService.deleteUserPostById).toHaveBeenCalledWith(
        mockUuidUser,
        mockingPostUuid,
      );
      expect(result).toEqual({ message: 'ok' });
    });
  });
});
