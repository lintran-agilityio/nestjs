// Libs
import {
  forwardRef,
  Inject,
  Injectable,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { instanceToPlain, plainToClass } from 'class-transformer';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';

// App sources
import { CUSTOM_PROVIDER_TOKENS } from '@app/shared/common';
import {
  MESSAGES,
  REDIS_CACHE_KEYS,
  REGEX,
  TTL_CACHE,
} from '@app/shared/constants';
import { QueryPaginationParamDto } from '@app/shared/dtos';
import { IMessageAndCountResponse, OrderBy, UserRole } from '@app/shared/types';
import {
  getSelectFields,
  getDataPagination,
  handleErrorException,
  isValidUserResponse,
  isValidUser,
  validOwnerShip,
  updateObjectFields,
  isValidUserCache,
  validateCacheEmail,
  processPaginationParams,
} from '@app/shared/utils';
import { HashingAbstractService } from '@app/shared/modules/hashing/hashing.abstract.service';
import { AppLoggerService } from '@app/shared/modules/logger/logger.service';
import { CacheAbstractService } from '@app/shared/modules/cache/cache.abstract.service';
import { AuditLoggerService } from '@app/shared/modules/audit-logger/audit-logger.service';

// Apis
import { PostService } from '@app/apis/posts/posts.service';

// Local sources
import { USER_SELECT_FIELDS } from './config';
import { UpdateAllUsersDto, UpdateUserByIdDto, UserResponseDto } from './dtos';
import { User } from './entities';
import { PostPaginationResponseDto } from '../posts/dtos';

// Destructure REDIS KEYS
const { BY_EMAIL, BY_ID, LIST } = REDIS_CACHE_KEYS.USERS;

@Injectable()
export class UserService {
  private readonly logger: LoggerService;

  private async cacheUser(
    cacheKey: string,
    user: User,
    ttl: number,
  ): Promise<void> {
    const plainUser = instanceToPlain(user);
    await this.cacheService.setKey(cacheKey, plainUser, ttl);
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

    private readonly auditLogger: AuditLoggerService,

    private readonly dataSource: DataSource,
  ) {
    // Create context name for logger
    this.logger = this.appLoggerServices.getLoggerName(UserService.name);
  }

  /**
   * Get all users with pagination
   * @param userId - Optional user ID for audit logging (may be undefined for public endpoints)
   * @param queryUrl - Query parameters for pagination, sorting, and filtering
   * @returns Paginated list of users with metadata
   * @throws InternalServerErrorException on server error
   */
  async getUsersRecently(
    userId: string | undefined,
    queryUrl: QueryPaginationParamDto,
  ): Promise<UserResponseDto> {
    this.logger.log('Get all users...');

    try {
      this.logger.log(`Query get all users: ${JSON.stringify(queryUrl)}`);

      const cacheKey = `${LIST}:${JSON.stringify(queryUrl ?? {})}`;
      const cached = await this.cacheService.getKey<UserResponseDto>(cacheKey);
      if (cached && isValidUserResponse(cached)) {
        this.logger.log('Users list served from cache');

        // Only log audit action if userId is provided
        if (userId) {
          await this.auditLogger.logAction({
            userId,
            action: 'LIST_USERS_RECENTLY',
            entity: 'User',
            data: {
              query: queryUrl,
              meta: cached.meta,
              servedFromCache: true,
            },
          });
        }

        return cached;
      }
      if (cached) {
        await this.cacheService.deleteKey(cacheKey);
      }

      const { search = '' } = queryUrl;

      // Get select fields for allowed sorting
      const selectFields = getSelectFields(USER_SELECT_FIELDS);

      const searchValue = search.trim();
      let cacheUpdated = false;

      try {
        const result = await this.dataSource.transaction<UserResponseDto>(
          async (manager) => {
            const transactionalRepo = manager.getRepository(User);

            // Build query inside transaction
            // Process pagination params first to know the sort field
            const paginationParams = processPaginationParams(queryUrl, {
              defaultLimit: 10,
              defaultPage: 1,
              defaultSortField: 'createdAt',
              defaultOrderBy: OrderBy.DESC,
              allowedSortFields: selectFields,
            });

            // Build query with explicit select
            // Ensure sort field is included for ORDER BY to work correctly
            const fieldsToSelect = [...selectFields];
            if (!fieldsToSelect.includes(paginationParams.sortField)) {
              fieldsToSelect.push(paginationParams.sortField);
            }

            let queryBuilder = transactionalRepo
              .createQueryBuilder('user')
              .where('user.deletedAt IS NULL') // Exclude soft-deleted users
              .select(fieldsToSelect.map((field) => `user.${field}`));

            // Search by (email | firstName | lastName)
            if (searchValue) {
              const normalizedSearch = `%${searchValue}%`;

              queryBuilder = queryBuilder.andWhere(
                '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
                { search: normalizedSearch },
              );
            }

            const paginatedResult = await getDataPagination<User>({
              selectFields,
              queryUrl,
              queryBuilder,
              logger: this.logger,
              entity: 'user',
            });

            // Set into Cache before committing so failures trigger rollback
            await this.cacheService.setKey(
              cacheKey,
              paginatedResult,
              TTL_CACHE.USERS_LIST,
            );
            cacheUpdated = true;

            // Only log audit action if userId is provided
            if (userId) {
              await this.auditLogger.logAction(
                {
                  userId,
                  action: 'LIST_USERS_RECENTLY',
                  entity: 'User',
                  data: {
                    query: queryUrl,
                    meta: paginatedResult.meta,
                    servedFromCache: false,
                  },
                },
                manager,
              );
            }

            return paginatedResult;
          },
        );

        this.logger.log('Fetched users list successfully');
        return result;
      } catch (transactionError) {
        if (cacheUpdated) {
          try {
            await this.cacheService.deleteKey(cacheKey);
          } catch (cacheCleanupError) {
            this.logger.error(
              `[Cache] - Failed to rollback cache for key ${cacheKey}: ${JSON.stringify(cacheCleanupError)}`,
            );
          }
        }

        this.logger.error(
          `[Transaction] - Failed to get users list: ${JSON.stringify(transactionError)}`,
        );
        throw transactionError;
      }
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
    const user = await this.usersRepo.findOne({
      where: { email, deletedAt: null },
    });

    if (!user) return null;

    return plainToClass(User, user);
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
    const cacheKey = `${BY_EMAIL}:${email}`;
    const cachedUser = await isValidUserCache<User>({
      cacheKey,
      cacheService: this.cacheService,
      logger: this.logger,
      identifier: 'email',
      entity: User,
      validator: isValidUser,
    });

    if (cachedUser) {
      return cachedUser;
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
    await this.cacheUser(cacheKey, user, TTL_CACHE.USER_BY_EMAIL);

    this.logger.log(`User fetched by email: ${email}`);
    return user;
  }

  /**
   * Get user by ID without throwing error
   * @param id - User ID
   * @returns User or null if not found
   */
  async getUserById(id: string, manager?: EntityManager): Promise<User | null> {
    this.logger.log(`Query get user by id: ${id}`);

    if (!manager) {
      // Get data from Redis cache
      const cacheKey = `${BY_ID}:${id}`;
      const cachedUser = await isValidUserCache<User>({
        cacheKey,
        cacheService: this.cacheService,
        logger: this.logger,
        entity: User,
        validator: isValidUser,
      });

      if (cachedUser) {
        return cachedUser;
      }
    }

    const repository = manager ? manager.getRepository(User) : this.usersRepo;

    const user = await repository.findOne({
      where: { id, deletedAt: null },
    });

    if (!manager && user) {
      // Cache data into Redis cache
      await this.cacheUser(`${BY_ID}:${id}`, user, TTL_CACHE.USER_BY_ID);
    }

    this.logger.log(`User fetched by id: ${id}`);
    return plainToClass(User, user);
  }

  /**
   * Get user by ID, throws error if not found
   * @param id - User ID
   * @returns User details
   * @throws NotFoundException if user not found
   */
  async getById(id: string, manager?: EntityManager): Promise<User> {
    this.logger.log(`Get user by id - ${id}`);

    if (manager) {
      const transactionalUser = await this.getUserById(id, manager);

      if (!transactionalUser) {
        this.logger.log(`User not found by: ${id}`);
        handleErrorException({
          defaultMessage: MESSAGES.USER_NOT_FOUND,
          ExceptionClass: NotFoundException,
        });
      }

      return transactionalUser;
    }

    // Get data from Redis cache
    const cacheKey = `${BY_ID}:${id}`;
    const cachedUser = await isValidUserCache<User>({
      cacheKey,
      cacheService: this.cacheService,
      logger: this.logger,
      entity: User,
      validator: isValidUser,
    });

    if (cachedUser) {
      return cachedUser;
    }

    const user = await this.getUserById(id);

    if (!user) {
      this.logger.log(`User not found by: ${id}`);

      handleErrorException({
        defaultMessage: MESSAGES.USER_NOT_FOUND,
        ExceptionClass: NotFoundException,
      });
    }

    this.logger.log(`User fetched by id: ${id}`);
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
      validOwnerShip({
        currentUser,
        value: identifier,
        field: 'id',
        logger: this.logger,
      });
      return this.getById(identifier);
    }

    // Check if identifier is an email
    if (REGEX.EMAIL.test(identifier)) {
      validOwnerShip({
        currentUser,
        value: identifier,
        field: 'email',
        logger: this.logger,
      });
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
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(User).update(id, { refreshToken });
    });
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

    try {
      const updatedUsers = await this.dataSource.transaction<User[]>(
        async (manager) => {
          const transactionalRepo = manager.getRepository(User);
          const transactionalUpdatedUsers: User[] = [];

          for (const userDto of users) {
            const { id } = userDto;
            const existingUser = await this.getById(id, manager);
            const payload: Partial<User> = { ...userDto };
            const { password } = payload;

            if (password) {
              payload.password = await this.hashingService.hash(password);
            }

            const userUpdating = updateObjectFields(existingUser, payload);
            const userUpdated = await transactionalRepo.save(userUpdating);
            transactionalUpdatedUsers.push(userUpdated);
          }

          return transactionalUpdatedUsers;
        },
      );

      // Invalidate related caches
      try {
        // Invalidate list caches
        await this.cacheService.deleteByPattern(`${LIST}:*`);
        // Invalidate and refresh item caches per updated user
        for (const user of updatedUsers) {
          await this.cacheService.deleteKey(`${BY_ID}:${user.id}`);
          if (user.email) {
            await this.cacheService.deleteKey(`${BY_EMAIL}:${user.email}`);
          }
          await this.cacheUser(
            `${BY_ID}:${user.id}`,
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
    this.logger.log('Updated user by ID...');

    try {
      const { savedUser, previousEmail } = await this.dataSource.transaction<{
        savedUser: User;
        previousEmail: string | null;
      }>(async (manager) => {
        const transactionalRepo = manager.getRepository(User);
        const existedUser = await this.getById(id, manager);
        const hashedPassword = updateUserDto.password
          ? await this.hashingService.hash(updateUserDto.password)
          : existedUser.password;

        this.logger.log(
          `Update user by id: ${id} and use update ${JSON.stringify(updateUserDto)}`,
        );

        const userUpdating = updateObjectFields(existedUser, {
          ...updateUserDto,
          password: hashedPassword,
        });
        const updatedUser = await transactionalRepo.save(userUpdating);

        await this.auditLogger.logAction(
          {
            userId: id,
            action: 'UPDATE_USER',
            entity: 'User',
            entityId: id,
            data: updatedUser,
          },
          manager,
        );

        return { savedUser: updatedUser, previousEmail: existedUser.email };
      });

      const { email } = savedUser;

      // Invalidate caches
      await this.cacheService.deleteKey(`${BY_ID}:${id}`);
      await this.cacheService.deleteByPattern(`${LIST}:*`);

      // Invalidate email cache (old and possibly new email)
      await validateCacheEmail({
        emailUpdated: email,
        prevEmail: previousEmail || undefined,
        cacheService: this.cacheService,
        logger: this.logger,
      });

      // Refresh item cache
      await this.cacheUser(`${BY_ID}:${id}`, savedUser, TTL_CACHE.USER_BY_ID);
      if (email) {
        await this.cacheUser(
          `${BY_EMAIL}:${email}`,
          savedUser,
          TTL_CACHE.USER_BY_EMAIL,
        );
      }

      delete savedUser.password;

      return savedUser;
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
  async deleteAll(userId: string): Promise<IMessageAndCountResponse> {
    this.logger.log('Delete all users data');
    try {
      const affected = await this.dataSource.transaction<number>(
        async (manager) => {
          const transactionalRepo = manager.getRepository(User);
          const usersCount = await transactionalRepo.count();

          if (!usersCount) {
            this.logger.error('[Error] - No users for delete');
            handleErrorException({
              defaultMessage: 'No users for delete',
              ExceptionClass: NotFoundException,
            });
          }

          const deleteResult = await transactionalRepo
            .createQueryBuilder()
            .softDelete()
            .execute();

          await this.auditLogger.logAction(
            {
              userId,
              action: 'DELETE_ALL_USERS',
              entity: 'User',
            },
            manager,
          );

          return deleteResult.affected || 0;
        },
      );

      this.logger.log(`All user deleted with ${JSON.stringify(affected)} item`);

      // Invalidate caches for users domain
      try {
        await this.cacheService.deleteByPattern(`${BY_ID}:*`);
        await this.cacheService.deleteByPattern(`${BY_EMAIL}:*`);
        await this.cacheService.deleteByPattern(`${LIST}:*`);
      } catch (cacheError) {
        this.logger.error(
          `[Cache] - Failed to invalidate cache after deleteAll: ${JSON.stringify(cacheError)}`,
        );
      }

      return {
        message: `Deleted ${affected} users successfully.`,
        count: affected,
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

    try {
      const deletedUser = await this.dataSource.transaction<User>(
        async (manager) => {
          const transactionalRepo = manager.getRepository(User);
          const existedUser = await this.getById(id, manager);

          // Using soft delete to mark the user as deleted
          await transactionalRepo
            .createQueryBuilder()
            .softDelete()
            .where('id = :id', { id })
            .execute();

          // Use Audit Logger to log the user deletion action
          await this.auditLogger.logAction(
            {
              userId: id,
              action: 'DELETE_USER',
              entity: 'User',
              entityId: id,
            },
            manager,
          );

          return existedUser;
        },
      );

      const { email } = deletedUser;

      // Invalidate caches
      await this.cacheService.deleteKey(`${BY_ID}:${id}`);
      await this.cacheService.deleteByPattern(`${LIST}:*`);

      await validateCacheEmail({
        prevEmail: email,
        cacheService: this.cacheService,
        logger: this.logger,
        cachedForFunctionName: 'deleteById',
      });

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
