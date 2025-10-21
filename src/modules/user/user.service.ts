// libs
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities';
import { UserQueryParamDto } from './dto';
import { getSelectFields } from '@app/shared/utils';
import { USE_SELECT_FIELDS } from './config';
import { OrderBy } from '@app/shared/types';
import { UserResponseDto } from './dto/get-user-response.dto';
import { MESSAGES } from '@app/shared/constants';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  private readonly logger = new Logger(UserService.name);

  async getUsers(params: UserQueryParamDto): Promise<UserResponseDto> {
    try {
      const { limit, orderBy, page, sortBy, search } = params;
      const query = {
        limit: 1,
        orderBy: OrderBy.ASC,
        page: 1,
        sortBy,
        search,
      };
      const numberPage = Number(page) || 1;
      const numberLimit = Number(limit) || 10;
      const skip = (numberPage - 1) * numberLimit;

      this.logger.log(`Query get all users: ${JSON.stringify(query)}`);

      // Fields selected
      const selectFields = getSelectFields(USE_SELECT_FIELDS);
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
      this.logger.log(
        `[Error] - Get error when get all user: ${JSON.stringify(error)}`,
      );

      throw new InternalServerErrorException('Server error');
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    this.logger.log(`Query get user by email: ${email}`);
    return await this.usersRepo.findOne({
      where: { email },
    });
  }

  async getUserById(id: string): Promise<User | null> {
    this.logger.log(`Query get user by id: ${id}`);
    return await this.usersRepo.findOne({
      where: { id },
    });
  }

  async updateRefreshToken(id: string, refreshToken: string) {
    await this.usersRepo.update(id, { refreshToken });
  }

  async updateAllUsers(id: string, updateUserDto: UpdateUserDto) {
    await this.usersRepo.update(id, updateUserDto);
    return this.usersRepo.findOne({ where: { id } });
  }

  async updateUserById(id: string, updateUserDto: UpdateUserDto) {
    this.logger.log(`Update user by id: ${id}`);

    const existedUser = await this.usersRepo.findOne({
      where: { id },
    });

    if (!existedUser) {
      this.logger.log(`User not found with id: ${id}`);
      throw new NotFoundException(MESSAGES.USER_NOT_FOUND);
    }

    
  }

  deleteUsers() {
    return 'Delete all user';
  }

  deleteUsersById(id: string) {
    return `This action removes a #${id} user`;
  }
}
