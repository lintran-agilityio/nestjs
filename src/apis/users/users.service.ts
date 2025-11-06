// Libs
import {
  forwardRef,
  Inject,
  Injectable,
  LoggerService,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// App sources
import { CUSTOM_PROVIDER_TOKENS } from '@app/shared/common';
import {
  MESSAGES,
  REDIS_CACHE_KEYS,
  REGEX,
  TTL_CACHE,
} from '@app/shared/constants';
import { QueryPaginationParamDto } from '@app/shared/dtos';
import { IMessageAndCountResponse, UserRole } from '@app/shared/types';
import {
  getSelectFields,
  getDataPagination,
  handleErrorException,
} from '@app/shared/utils';
import { HashingAbstractService } from '@app/shared/modules/hashing/hashing.abstract.service';
import { AppLoggerService } from '@app/shared/modules/logger/logger.service';
import { CacheAbstractService } from '@app/shared/modules/cache/cache.abstract.service';

// Apis
import { PostService } from '@app/apis/posts/posts.service';

// Local sources
import { USER_SELECT_FIELDS } from './config';
import { UpdateAllUsersDto, UpdateUserByIdDto, UserResponseDto } from './dtos';
import { User } from './entities';
import { PostPaginationResponseDto } from '../posts/dtos';

@Injectable()
export class UserService {
  private readonly logger: LoggerService;

  // Validate cached shapes before use
  private isValidUser(candidate: unknown): candidate is User {
    if (!candidate || typeof candidate !== 'object') return false;
    const obj = candidate as Record<string, unknown>;
    return typeof obj.id === 'string' && typeof obj.email === 'string';
  }

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,

    @Inject(CUSTOM_PROVIDER_TOKENS.PASSWORD_HASHING_SERVICE)
    private readonly hashingService: HashingAbstractService,

    private readonly appLoggerServices: AppLoggerService,

    @Inject(forwardRef(() => PostService))
    private readonly postService: PostService,

    private readonly cacheService: CacheAbstractService,
  ) {
    // Create context name for logger
    this.logger = this.appLoggerServices.getLoggerName(UserService.name);
  }

  /**
   * Get all users with pagination
   * @param queryUrl - Query parameters for pagination, sorting, and filtering
   * @returns Paginated list of users with metadata
   * @throws InternalServerErrorException on server error
   */
  async getAll(queryUrl: QueryPaginationParamDto): Promise<UserResponseDto> {
    this.logger.log('Get all users...');

    try {
      this.logger.log(`Query get all users: ${JSON.stringify(queryUrl)}`);

      const { search } = queryUrl;

      // Get select fields for allowed sorting
      const selectFields = getSelectFields(USER_SELECT_FIELDS);

      // Build query
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

      const result = await getDataPagination<User>({
        selectFields,
        queryUrl,
        queryBuilder,
        logger: this.logger,
        entity: 'user',
      });

      return result;
    } catch (error) {
      this.logger.error(
        `[Error] - Get error when get all user: ${JSON.stringify(error)}`,
      );

      handleErrorException({
        error,
        defaultMessage: MESSAGES.GET_USER_FAILED,
      });
    }
  }

  /**
   * Get user by email without throwing error
   * @param email - User email
   * @returns User or null if not found
   */
  async getUserByEmail(email: string): Promise<User | null> {
    this.logger.log(`Query get user by email: ${email}`);
    return await this.usersRepo.findOne({
      where: { email },
    });
  }

  /**
   * Find user by email, throws error if not found
   * @param email - User email
   * @returns User details
   * @throws NotFoundException if user not found
   */
  async getByEmail(email: string): Promise<User> {
    this.logger.log(`Get user by email - ${email}`);

    // Get data from Redis cache
    const cacheKey = `${REDIS_CACHE_KEYS.USERS.BY_EMAIL}:${email}`;
    const cached = await this.cacheService.getKey<User>(cacheKey);
    if (cached) {
      if (this.isValidUser(cached)) {
        this.logger.log('User by email served from cache');
        return cached;
      }
      await this.cacheService.deleteKey(cacheKey);
    }

    const user = await this.getUserByEmail(email);

    if (!user) {
      this.logger.error(`User not found by: ${email}`);

      handleErrorException({
        defaultMessage: MESSAGES.USER_NOT_FOUND,
        ExceptionClass: NotFoundException,
      });
    }

    // Cache data into Redis cache
    await this.cacheService.setKey(cacheKey, user, TTL_CACHE.USER_BY_EMAIL);

    return user;
  }

  /**
   * Get user by ID without throwing error
   * @param id - User ID
   * @returns User or null if not found
   */
  async getUserById(id: string): Promise<User | null> {
    this.logger.log(`Query get user by id: ${id}`);

    // Get data from Redis cache
    const cacheKey = `${REDIS_CACHE_KEYS.USERS.BY_ID}:${id}`;
    const cached = await this.cacheService.getKey<User>(cacheKey);
    if (cached) {
      if (this.isValidUser(cached)) {
        this.logger.log('User by id served from cache');
        return cached;
      }
      await this.cacheService.deleteKey(cacheKey);
    }

    const user = await this.usersRepo.findOne({
      where: { id },
    });

    if (user) {
      // Cache data into Redis cache
      await this.cacheService.setKey(cacheKey, user, TTL_CACHE.USER_BY_ID);
    }

    return user;
  }

  /**
   * Get user by ID, throws error if not found
   * @param id - User ID
   * @returns User details
   * @throws NotFoundException if user not found
   */
  async getById(id: string): Promise<User> {
    this.logger.log(`Get user by id - ${id}`);

    // Get data from Redis cache
    const cacheKey = `${REDIS_CACHE_KEYS.USERS.BY_ID}:${id}`;
    const cached = await this.cacheService.getKey<User>(cacheKey);
    console.log('cached==========>', cached)
    if (cached) {
      if (this.isValidUser(cached)) {
        this.logger.log('User by id served from cache');
        return cached;
      }
      await this.cacheService.deleteKey(cacheKey);
    }

    const user = await this.getUserById(id);

    if (!user) {
      this.logger.log(`User not found by: ${id}`);

      handleErrorException({
        defaultMessage: MESSAGES.USER_NOT_FOUND,
        ExceptionClass: NotFoundException,
      });
    }

    if (user) {
      console.log('user', cacheKey, user)
      // Cache data into Redis cache
      await this.cacheService.setKey(cacheKey, user, TTL_CACHE.USER_BY_ID);
    }

    return user;
  }

  /**
   * Get user by ID or email, automatically detects the type of identifier
   * @param identifier - User ID (UUID) or email address
   * @param currentUser - Currently authenticated user for ownership validation
   * @returns User details
   * @throws NotFoundException if user not found
   * @throws ForbiddenException if non-admin user tries to access another user's data
   */
  async getByIdOrEmail(
    identifier: string,
    currentUser?: { id: string; email: string; role: UserRole },
  ): Promise<User> {
    this.logger.log(`Get user by identifier - ${identifier}`);

    // Check if identifier is a UUID
    if (REGEX.UUID_ANY.test(identifier)) {
      // For UUID, check ownership if current user is provided
      if (currentUser && currentUser.role !== UserRole.ADMIN) {
        // Non-admin users can only access their own profile
        if (currentUser.id !== identifier) {
          this.logger.error(
            `User ${currentUser.id} attempted to access UUID ${identifier}`,
          );
          handleErrorException({
            defaultMessage: MESSAGES.NO_PERMISSION,
            ExceptionClass: ForbiddenException,
          });
        }
      }
      return this.getById(identifier);
    }

    // Check if identifier is an email
    if (REGEX.EMAIL.test(identifier)) {
      // For email, check ownership manually
      if (currentUser && currentUser.role !== UserRole.ADMIN) {
        // Non-admin users can only access their own email
        if (currentUser.email !== identifier) {
          this.logger.error(
            `User ${currentUser.id} attempted to access email ${identifier}`,
          );
          handleErrorException({
            defaultMessage: MESSAGES.NO_PERMISSION,
            ExceptionClass: ForbiddenException,
          });
        }
      }
      return this.getByEmail(identifier);
    }

    // If neither UUID nor email, treat as invalid and throw error
    this.logger.error(`Invalid identifier format: ${identifier}`);
    handleErrorException({
      defaultMessage: MESSAGES.USER_INVALID_IDENTIFIER,
      ExceptionClass: NotFoundException,
    });
  }

  /**
   * Update refresh token for user
   * @param id - User ID
   * @param refreshToken - New refresh token
   */
  async updateRefreshToken(id: string, refreshToken: string): Promise<void> {
    this.logger.log(
      `Update refresh token when token is expire with user id - ${id}`,
    );
    await this.usersRepo.update(id, { refreshToken });
  }

  /**
   * Update multiple users at once
   * @param updateUsersDto - DTO containing array of users to update
   * @returns Array of updated users
   * @throws InternalServerErrorException on server error
   */
  async updateAll(updateUsersDto: UpdateAllUsersDto): Promise<User[]> {
    this.logger.log(
      `Update all user' information have  ${JSON.stringify(updateUsersDto)}`,
    );
    const users = updateUsersDto.users || [];
    const updatedUsers: User[] = [];

    try {
      for (const userDto of users) {
        const { id } = userDto;
        const existingUser = await this.getById(id);
        userDto.password = await this.hashingService.hash(userDto.password);
        const userUpdating = this.usersRepo.merge(existingUser, userDto);
        const userUpdated = await this.usersRepo.save(userUpdating);
        updatedUsers.push(userUpdated);
      }

      // Invalidate related caches
      try {
        // Invalidate list caches
        await this.cacheService.deleteByPattern(
          `${REDIS_CACHE_KEYS.USERS.LIST}:*`,
        );
        // Invalidate and refresh item caches per updated user
        for (const user of updatedUsers) {
          await this.cacheService.deleteKey(
            `${REDIS_CACHE_KEYS.USERS.BY_ID}:${user.id}`,
          );
          if (user.email) {
            await this.cacheService.deleteKey(
              `${REDIS_CACHE_KEYS.USERS.BY_EMAIL}:${user.email}`,
            );
          }
          await this.cacheService.setKey(
            `${REDIS_CACHE_KEYS.USERS.BY_ID}:${user.id}`,
            user,
            TTL_CACHE.USER_BY_ID,
          );
        }
      } catch (cacheError) {
        this.logger.error(
          `[Cache] - Failed to invalidate/refresh cache after updateAll: ${JSON.stringify(cacheError)}`,
        );
      }

      this.logger.log(
        `[Success] - Update all users successful ${JSON.stringify(updatedUsers)}`,
      );
      return updatedUsers;
    } catch (error) {
      this.logger.error(`
        [Error] - Error log: ${JSON.stringify(error, null, 2)}
      `);

      handleErrorException({
        error,
        defaultMessage: MESSAGES.UPDATE_USER_FAILED,
      });
    }
  }

  /**
   * Update a user by ID
   * @param id - User ID
   * @param updateUserDto - Updated user data
   * @returns Success message
   * @throws NotFoundException if user not found
   * @throws InternalServerErrorException on server error
   */
  async updateById(
    id: string,
    updateUserDto: UpdateUserByIdDto,
  ): Promise<User> {
    const { password } = updateUserDto;
    this.logger.log('Updated user by ID...');

    const existedUser = await this.getById(id);

    try {
      const hashedPassword = password
        ? await this.hashingService.hash(updateUserDto.password)
        : existedUser.password;

      const email = updateUserDto.email || existedUser.email;

      this.logger.log(
        `Update user by id: ${id} and use update ${JSON.stringify(updateUserDto)}`,
      );
      const updatedUser = await this.usersRepo.update(id, {
        ...updateUserDto,
        password: hashedPassword,
      });

      // Invalidate caches
      await this.cacheService.deleteKey(
        `${REDIS_CACHE_KEYS.USERS.BY_ID}:${id}`,
      );
      await this.cacheService.deleteByPattern(
        `${REDIS_CACHE_KEYS.USERS.LIST}:*`,
      );
      // Invalidate email cache (old and possibly new email)
      try {
        await this.cacheService.deleteKey(
          `${REDIS_CACHE_KEYS.USERS.BY_EMAIL}:${email}`,
        );
      } catch (cacheErr) {
        this.logger.error(
          `[Cache] - Failed to invalidate email cache in updateById: ${JSON.stringify(cacheErr)}`,
        );
      }
      // Refresh item cache
      await this.cacheService.setKey(
        `${REDIS_CACHE_KEYS.USERS.BY_ID}:${id}`,
        updatedUser,
        TTL_CACHE.USER_BY_ID,
      );

      delete existedUser.password;

      return {
        ...existedUser,
        ...updateUserDto,
        id,
      };
    } catch (error) {
      this.logger.error(`[Error] - update user error ${JSON.stringify(error)}`);
      handleErrorException({
        error,
        defaultMessage: MESSAGES.UPDATE_USER_FAILED,
      });
    }
  }

  /**
   * Delete all users
   * @returns Success message with deletion count
   * @throws NotFoundException if no users found
   * @throws InternalServerErrorException on server error
   */
  async deleteAll(): Promise<IMessageAndCountResponse> {
    this.logger.log('Delete all users data');
    const users = await this.usersRepo.find();
    if (!users.length) {
      this.logger.error('[Error] - No users for delete');
      handleErrorException({
        defaultMessage: 'No users for delete',
        ExceptionClass: NotFoundException,
      });
    }

    try {
      const { affected } = await this.usersRepo
        .createQueryBuilder()
        .delete()
        .execute();

      this.logger.log(`All user deleted with ${JSON.stringify(affected)} item`);

      // Invalidate caches for users domain
      try {
        await this.cacheService.deleteByPattern(
          `${REDIS_CACHE_KEYS.USERS.BY_ID}:*`,
        );
        await this.cacheService.deleteByPattern(
          `${REDIS_CACHE_KEYS.USERS.BY_EMAIL}:*`,
        );
        await this.cacheService.deleteByPattern(
          `${REDIS_CACHE_KEYS.USERS.LIST}:*`,
        );
      } catch (cacheError) {
        this.logger.error(
          `[Cache] - Failed to invalidate cache after deleteAll: ${JSON.stringify(cacheError)}`,
        );
      }

      return {
        message: `Deleted ${affected} users successfully.`,
        count: affected || 0,
      };
    } catch (error) {
      this.logger.error(
        `[Error] - delete users error ${JSON.stringify(error)}`,
      );

      handleErrorException({
        error,
        defaultMessage: MESSAGES.DELETE_USER_FAILED,
      });
    }
  }

  /**
   * Delete a user by ID
   * @param id - User ID
   * @returns Success message
   * @throws NotFoundException if user not found
   * @throws InternalServerErrorException on server error
   */
  async deleteById(id: string): Promise<void> {
    this.logger.log(`Delete user by ${id}`);

    const existedUser = await this.getById(id);

    try {
      await this.usersRepo.remove(existedUser);

      // Invalidate caches
      await this.cacheService.deleteKey(
        `${REDIS_CACHE_KEYS.USERS.BY_ID}:${id}`,
      );
      await this.cacheService.deleteByPattern(
        `${REDIS_CACHE_KEYS.USERS.LIST}:*`,
      );
      try {
        if (existedUser.email) {
          await this.cacheService.deleteKey(
            `${REDIS_CACHE_KEYS.USERS.BY_EMAIL}:${existedUser.email}`,
          );
        }
      } catch (cacheErr) {
        this.logger.error(
          `[Cache] - Failed to invalidate email cache in deleteById: ${JSON.stringify(cacheErr)}`,
        );
      }

      this.logger.log(`User with id is ${id} deleted`);
    } catch (error) {
      this.logger.error(`[Error] - delete user error ${JSON.stringify(error)}`);
      handleErrorException({
        error,
        defaultMessage: MESSAGES.DELETE_USER_FAILED,
      });
    }
  }

  /**
   * Delete a user's post by ID
   * @param userId - User ID
   * @param postId - Post ID
   * @returns Success message
   * @throws InternalServerErrorException on server error
   */
  async deletePostById(userId: string, postId: string): Promise<void> {
    return await this.postService.deletePostById(userId, postId);
  }

  async getAllPostOfUser(userId: string): Promise<PostPaginationResponseDto> {
    return await this.postService.getAllPostOfUser(userId);
  }
}
