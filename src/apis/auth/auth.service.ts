// Libs
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  LoggerService,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

// Apis
import { User } from '@app/apis/users/entities';
import { UserService } from '@app/apis/users/users.service';

// App sources
import { AppLoggerService } from '@app/shared/modules/logger/logger.service';
import { CUSTOM_PROVIDER_TOKENS, JWT_KEYS } from '@app/shared/common';
import { MESSAGES, REDIS_CACHE_KEYS, TTL_CACHE } from '@app/shared/constants';
import { IJwtAuthPayload, UserRole, UserStatus } from '@app/shared/types';
import { HashingAbstractService } from '@app/shared/modules/hashing/hashing.abstract.service';
import { CacheAbstractService } from '@app/shared/modules/cache/cache.abstract.service';

// Local sources
import {
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
} from './dto';
import { handleErrorException } from '@app/shared/utils';

@Injectable()
export class AuthService {
  private readonly logger: LoggerService;

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @Inject(CUSTOM_PROVIDER_TOKENS.PASSWORD_HASHING_SERVICE)
    private readonly hashingService: HashingAbstractService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly appLoggerService: AppLoggerService,
    private readonly cacheService: CacheAbstractService,
  ) {
    this.logger = this.appLoggerService.getLoggerName(AuthService.name);
  }

  /**
   * Register a new user
   * @param registerDto - User registration data
   * @returns Registered user information
   * @throws ConflictException if user already exists
   * @throws InternalServerErrorException on server error
   */
  async register(
    registerDto: RegisterRequestDto,
  ): Promise<RegisterResponseDto> {
    const { email, password, firstName, lastName } = registerDto || {};

    this.logger.log(`
      Register user data: ${JSON.stringify(registerDto, null, 2)}
    `);

    const existingUser = await this.userService.getUserByEmail(email);

    if (existingUser) {
      this.logger.log(`
        User already exists: ${JSON.stringify(existingUser, null, 2)}
      `);

      handleErrorException({
        defaultMessage: MESSAGES.USER_ALREADY_EXISTS,
        ExceptionClass: ConflictException,
      });
    }

    const hashedPassword = await this.hashingService.hash(password);

    try {
      const newUser = this.usersRepo.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        status: UserStatus.ACTIVE,
      } as DeepPartial<User>);

      const savedUser = await this.usersRepo.save(newUser);

      try {
        await this.cacheService.deleteByPattern(
          `${REDIS_CACHE_KEYS.USERS.LIST}:*`,
        );
        await this.cacheService.setKey(
          `${REDIS_CACHE_KEYS.USERS.BY_ID}:${savedUser.id}`,
          savedUser,
          TTL_CACHE.USER_BY_ID,
        );
        if (savedUser.email) {
          await this.cacheService.setKey(
            `${REDIS_CACHE_KEYS.USERS.BY_EMAIL}:${savedUser.email}`,
            savedUser,
            TTL_CACHE.USER_BY_EMAIL,
          );
        }
      } catch (cacheError) {
        this.logger.error(
          `[Cache] - Failed to prime user cache after register: ${JSON.stringify(cacheError)}`,
        );
      }

      return new RegisterResponseDto({
        id: savedUser.id,
        email: savedUser.email,
        role: UserRole.USER,
        status: savedUser.status,
      });
    } catch (error) {
      this.logger.error(`[Register Error] - ${JSON.stringify(error, null, 2)}`);

      handleErrorException({
        error,
        defaultMessage: MESSAGES.REGISTER_FAILED,
      });
    }
  }

  /**
   * Authenticate user and return access tokens
   * @param loginDto - User login credentials (email and password)
   * @returns Access token, refresh token, and user information
   * @throws UnauthorizedException if user not found or invalid credentials
   * @throws BadRequestException if password is incorrect
   * @throws InternalServerErrorException on server error
   */
  async login(loginDto: LoginRequestDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    this.logger.log(`Login user data: ${JSON.stringify(loginDto, null, 2)}`);

    const existingUser = await this.userService.getUserByEmail(email);

    if (!existingUser) {
      this.logger.error(`User not found: ${email}`);

      handleErrorException({
        defaultMessage: MESSAGES.USER_NOT_FOUND,
        ExceptionClass: UnauthorizedException,
      });
    }

    const { id, status, role } = existingUser;

    try {
      const isValidPassword = await this.hashingService.compare(
        password,
        existingUser.password,
      );

      if (!isValidPassword) {
        this.logger.error(`Wrong password for user: ${email}`);

        handleErrorException({
          defaultMessage: MESSAGES.USER_WRONG_PASSWORD,
          ExceptionClass: BadRequestException,
        });
      }

      const payload: IJwtAuthPayload = {
        id,
        email,
        role,
        status,
      };

      const accessToken = await this.jwtService.signAsync(payload, {
        secret:
          this.configService.get<string>(JWT_KEYS.JWT_SECRET) ?? 'super-secret',
        expiresIn: this.configService.get(JWT_KEYS.JWT_EXPIRES_IN) ?? '1h',
      });

      const refreshToken = await this.jwtService.signAsync(payload, {
        secret:
          this.configService.get<string>(JWT_KEYS.JWT_REFRESH_SECRET) ??
          'super-refresh-secret',
        expiresIn: (this.configService.get<string>(
          JWT_KEYS.JWT_REFRESH_EXPIRES_IN,
        ) ?? '7d') as JwtSignOptions['expiresIn'],
      });

      const hashedRefreshToken = await this.hashingService.hash(refreshToken);

      // Add refresh token into Redis cache
      await this.cacheService.setKey(
        `${REDIS_CACHE_KEYS.REFRESH_TOKEN}:${id}`,
        hashedRefreshToken,
        TTL_CACHE.REFRESH_TOKEN,
      );
      await this.userService.updateRefreshToken(id, hashedRefreshToken);
      this.logger.log(`User Login success with: ${email}`);

      return {
        accessToken,
        refreshToken,
        user: payload,
      };
    } catch (error) {
      this.logger.error(`[Login Error] - ${JSON.stringify(error, null, 2)}`);

      handleErrorException({
        error,
        defaultMessage: MESSAGES.LOGIN_FAILED,
      });
    }
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken - The refresh token string
   * @returns New access token
   * @throws UnauthorizedException if refresh token is invalid or expired
   */
  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    this.logger.warn(`Refresh token request received`);

    // Normalize potential line breaks/spaces from transport
    const token = (refreshToken ?? '').toString().replace(/\s+/g, '');
    try {
      const payload = await this.jwtService.verifyAsync<IJwtAuthPayload>(
        token,
        {
          secret:
            this.configService.get<string>(JWT_KEYS.JWT_REFRESH_SECRET) ??
            'super-refresh-secret',
        },
      );

      // Get cached refresh token first from Redis cache
      const cachedHashedRefreshToken = await this.cacheService.getKey<string>(
        `${REDIS_CACHE_KEYS.REFRESH_TOKEN}:${payload.id}`,
      );

      if (cachedHashedRefreshToken) {
        // Validate cache token
        const isCachedValid = await this.hashingService.compare(
          token,
          cachedHashedRefreshToken,
        );

        if (!isCachedValid) {
          this.logger.error(MESSAGES.INVALID_REFRESH_TOKEN);

          handleErrorException({
            defaultMessage: MESSAGES.USER_INVALID_REFRESH_TOKEN,
            ExceptionClass: UnauthorizedException,
          });
        }
      } else {
        this.logger.warn(
          `No cached refresh token found for user ID: ${payload.id}`,
        );
        // Fallback to DB stored refresh token if cache is missing
        const user = await this.userService.getUserById(payload.id);

        if (!user || !user.refreshToken) {
          this.logger.error(MESSAGES.INVALID_REFRESH_TOKEN);

          handleErrorException({
            defaultMessage: MESSAGES.USER_INVALID_REFRESH_TOKEN,
            ExceptionClass: UnauthorizedException,
          });
        }

        const isValid = await this.hashingService.compare(
          token,
          user.refreshToken,
        );

        if (!isValid) {
          this.logger.error(MESSAGES.INVALID_REFRESH_TOKEN);

          handleErrorException({
            defaultMessage: MESSAGES.USER_INVALID_REFRESH_TOKEN,
            ExceptionClass: UnauthorizedException,
          });
        }
      }

      // Strip time-based fields from incoming payload before re-signing
      const {
        iat: _iat,
        exp: _exp,
        ...sanitizedPayload
      } = payload as Record<string, any>;

      // Generate and hash new tokens
      const newAccessToken = await this.jwtService.signAsync(
        sanitizedPayload as IJwtAuthPayload,
        {
          secret:
            this.configService.get<string>(JWT_KEYS.JWT_SECRET) ??
            'super-secret',
          expiresIn: (this.configService.get<string>(JWT_KEYS.JWT_EXPIRES_IN) ||
            '1h') as JwtSignOptions['expiresIn'],
        },
      );

      // Rotate refresh token: generate, hash, and cache
      const newRefreshToken = await this.jwtService.signAsync(
        sanitizedPayload as IJwtAuthPayload,
        {
          secret:
            this.configService.get<string>(JWT_KEYS.JWT_REFRESH_SECRET) ??
            'super-refresh-secret',
          expiresIn: (this.configService.get<string>(
            JWT_KEYS.JWT_REFRESH_EXPIRES_IN,
          ) || '7d') as JwtSignOptions['expiresIn'],
        },
      );

      const newHashedRefreshToken =
        await this.hashingService.hash(newRefreshToken);

      // Invalidate caches
      await this.cacheService.deleteKey(
        `${REDIS_CACHE_KEYS.REFRESH_TOKEN}:${payload.id}`,
      );

      await this.cacheService.setKey(
        `${REDIS_CACHE_KEYS.REFRESH_TOKEN}:${payload.id}`,
        newHashedRefreshToken,
        TTL_CACHE.REFRESH_TOKEN,
      );
      await this.userService.updateRefreshToken(
        payload.id,
        newHashedRefreshToken,
      );

      this.logger.log(`Refresh token successful for user ID: ${payload.id}`);
      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      this.logger.error(
        `[Refresh Token Error] - ${MESSAGES.USER_TOKEN_EXPIRED} - ${JSON.stringify(error, null, 2)}`,
      );

      handleErrorException({
        error,
        defaultMessage: MESSAGES.USER_INVALID_REFRESH_TOKEN,
      });
    }
  }
}
