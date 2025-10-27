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

// App sources
import { HashingAbstractService } from '@app/modules/hashing/hashing.abstract.service';
import { AppLoggerService } from '@app/modules/logger/logger.service';
import { User } from '@app/modules/users/entities';
import { UserService } from '@app/modules/users/users.service';
import { CUSTOM_PROVIDER_TOKENS } from '@app/shared/common';
import { MESSAGES } from '@app/shared/constants';
import { IJwtAuthPayload } from '@app/shared/types';

// Local sources
import {
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
} from './dto';
import { handleErrorException } from '@app/shared/utils/error.utils';

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
    const { email, password, role, firstName, lastName, status } =
      registerDto || {};

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
        role,
        status,
      } as DeepPartial<User>);

      const savedUser = await this.usersRepo.save(newUser);

      return new RegisterResponseDto({
        id: savedUser.id,
        email: savedUser.email,
        role: savedUser.role,
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
        id: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
        status: existingUser.status,
      };

      const accessToken = await this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET') ?? 'super-secret',
        expiresIn: this.configService.get('JWT_EXPIRES_IN') ?? '1h',
      });

      const refreshToken = await this.jwtService.signAsync(payload, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ??
          'super-refresh-secret',
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ??
          '7d') as JwtSignOptions['expiresIn'],
      });

      const hashedRefreshToken = await this.hashingService.hash(refreshToken);
      await this.userService.updateRefreshToken(
        existingUser.id,
        hashedRefreshToken,
      );

      return {
        accessToken,
        refreshToken,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          role: existingUser.role,
          status: existingUser.status,
        },
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
  async refreshTokens(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = await this.jwtService.verifyAsync<IJwtAuthPayload>(
        refreshToken,
        {
          secret:
            this.configService.get<string>('JWT_REFRESH_SECRET') ??
            'default-refresh-secret',
        },
      );

      const user = await this.userService.getUserById(payload.id);

      if (!user || !user.refreshToken) {
        this.logger.error(MESSAGES.INVALID_REFRESH_TOKEN);

        handleErrorException({
          defaultMessage: MESSAGES.USER_INVALID_REFRESH_TOKEN,
          ExceptionClass: UnauthorizedException,
        });
      }

      const isValid = await this.hashingService.compare(
        refreshToken,
        user.refreshToken,
      );

      if (!isValid) {
        this.logger.error(MESSAGES.INVALID_REFRESH_TOKEN);

        handleErrorException({
          defaultMessage: MESSAGES.USER_INVALID_REFRESH_TOKEN,
          ExceptionClass: UnauthorizedException,
        });
      }

      const newAccessToken = await this.jwtService.signAsync(payload, {
        secret:
          this.configService.get<string>('JWT_SECRET') ?? 'default-secret',
        expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') ||
          '1h') as JwtSignOptions['expiresIn'],
      });

      return { accessToken: newAccessToken };
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
