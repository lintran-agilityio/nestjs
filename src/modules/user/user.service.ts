// libs
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './entities';
import {
  DeleteAllUsersDto,
  UpdateAllUsersDto,
  UpdateUserByIdDto,
  UserResponseDto,
} from './dto';
import { getSelectFields } from '@app/shared/utils';
import { USER_SELECT_FIELDS } from './config';
import { IMessageAndCountRepose, OrderBy } from '@app/shared/types';
import { MESSAGES } from '@app/shared/constants';
import { HashingAbstractService } from '../hashing/hashing.abstract.service';
import { CUSTOM_PROVIDER_TOKENS } from '@app/shared/common';
import { AppLoggerService } from '../logger/logger.service';
import { QueryPaginationParamDto } from '@app/shared/dto';

@Injectable()
export class UserService {
  private readonly logger: LoggerService;

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    @Inject(CUSTOM_PROVIDER_TOKENS.PASSWORD_HASHING_SERVICE)
    private readonly hashingService: HashingAbstractService,

    private readonly appLoggerServices: AppLoggerService,
  ) {
    // Create context name for logger
    this.logger = this.appLoggerServices.getLoggerName(UserService.name);
  }

  async getUsers(queryUrl: QueryPaginationParamDto): Promise<UserResponseDto> {
    this.logger.log('Get all users...');

    try {
      this.logger.warn(`Query get all users: ${JSON.stringify(queryUrl)}`);
      const { limit, orderBy, page, sortBy, search } = queryUrl;
      const query = {
        limit: limit || 1,
        orderBy: orderBy || OrderBy.ASC,
        page: page || 1,
        sortBy,
        search,
      };
      const numberPage = Number(page) || 1;
      const numberLimit = Number(limit) || 10;
      const skip = (numberPage - 1) * numberLimit;

      this.logger.warn(`Query get all users: ${JSON.stringify(query)}`);

      // Fields selected
      const selectFields = getSelectFields(USER_SELECT_FIELDS);
      const allowedSortFields = selectFields;
      const sortField = allowedSortFields.includes(sortBy ?? '')
        ? sortBy
        : 'id';

      let queryBuilder = this.usersRepo
        .createQueryBuilder('user')
        .select(selectFields.map((field) => `user.${field}`));

      // Search by (email | firstName | lastName)
      if (search) {
        queryBuilder = queryBuilder.andWhere(
          '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      // Apply sorting and pagination
      queryBuilder = queryBuilder
        .orderBy(`user.${sortField}`, orderBy)
        .skip(skip)
        .take(limit);

      const [data, total] = await queryBuilder.getManyAndCount();

      this.logger.log(`Get all users successful: ${JSON.stringify(data)}`);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(
        `[Error] - Get error when get all user: ${JSON.stringify(error)}`,
      );

      throw new InternalServerErrorException('Server error');
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    this.logger.warn(`Query get user by email: ${email}`);
    return await this.usersRepo.findOne({
      where: { email },
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    this.logger.log('Get user by email...');
    const user = await this.getUserByEmail(email);

    if (!user) {
      this.logger.error(`User not found by: ${email}`);

      throw new NotFoundException(MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    this.logger.warn(`Query get user by id: ${id}`);
    return await this.usersRepo.findOne({
      where: { id },
    });
  }

  async findUserById(id: string): Promise<User | null> {
    this.logger.log('Get user by id...');
    const user = await this.getUserById(id);

    if (!user) {
      this.logger.log(`User not found by: ${id}`);

      throw new NotFoundException(MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  async updateRefreshToken(id: string, refreshToken: string) {
    this.logger.log('Update refresh token when token is expire...');
    await this.usersRepo.update(id, { refreshToken });
  }

  async updateAllUsers(updateUsersDto: UpdateAllUsersDto) {
    this.logger.warn(
      `Update all user' information have  ${JSON.stringify(updateUsersDto)}`,
    );
    const users = updateUsersDto.users || [];
    const updatedUsers: User[] = [];

    try {
      for (const userDto of users) {
        const { id } = userDto;
        const existingUser = await this.findUserById(id);
        userDto.password = await this.hashingService.hash(userDto.password);
        const userUpdating = this.usersRepo.merge(existingUser, userDto);
        const userUpdated = await this.usersRepo.save(userUpdating);
        updatedUsers.push(userUpdated);
      }

      this.logger.log(
        `Update all users successful ${JSON.stringify(updatedUsers)}`,
      );
      return updatedUsers;
    } catch (error) {
      this.logger.error(`
        [Error] - Error log: ${JSON.stringify(error, null, 2)}
      `);

      throw new InternalServerErrorException('Server error');
    }
  }

  async updateUserById(
    id: string,
    updateUserDto: UpdateUserByIdDto,
  ): Promise<IMessageAndCountRepose> {
    const { password } = updateUserDto;
    this.logger.log('Updated user by ID...');

    const existedUser = await this.findUserById(id);

    try {
      const hashedPassword = password
        ? await this.hashingService.hash(updateUserDto.password)
        : existedUser.password;

      this.logger.warn(
        `Update user by id: ${id} and use update ${JSON.stringify(updateUserDto)}`,
      );
      await this.usersRepo.update(id, {
        // ...existedUser,
        ...updateUserDto,
        password: hashedPassword,
      });

      return {
        message: `User id - ${id} updated successfully`,
      };
    } catch (error) {
      this.logger.error(`[Error] - update user error ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('Server error');
    }
  }

  async deleteUsers(_dto: DeleteAllUsersDto): Promise<IMessageAndCountRepose> {
    this.logger.log('Delete all users data');
    const users = await this.usersRepo.find();
    if (!users.length) {
      this.logger.error('[Error] - No users for delete');
      throw new NotFoundException('No users for delete');
    }

    try {
      const { affected } = await this.usersRepo
        .createQueryBuilder()
        .delete()
        .execute();

      this.logger.log(`All user deleted with ${JSON.stringify(affected)} item`);
      return {
        message: `Deleted ${affected} users successfully.`,
        count: affected || 0,
      };
    } catch (error) {
      this.logger.error(
        `[Error] - delete users error ${JSON.stringify(error)}`,
      );
      throw new InternalServerErrorException('Server error');
    }
  }

  async deleteUsersById(id: string): Promise<IMessageAndCountRepose> {
    this.logger.warn(`Delete user by ${id}`);

    const existedUser = await this.findUserById(id);

    try {
      await this.usersRepo.remove(existedUser);

      this.logger.log(`User with id is ${id} deleted`);

      return {
        message: MESSAGES.USER_DELETE_SUCCESS,
      };
    } catch (error) {
      this.logger.error(`[Error] - delete user error ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('Server error');
    }
  }
}
