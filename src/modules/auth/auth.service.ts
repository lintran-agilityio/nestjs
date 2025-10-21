// libs
import {
  Injectable,
  Logger,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository, DeepPartial } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';

import {
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
} from './dto';
import { User } from '@app/modules/user/entities';
import { MESSAGES } from '@app/shared/constants';
import { HashingAbstractService } from '@app/modules/hashing/hashing.abstract.service';
import { Inject } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { IJwtAuthPayload } from '@app/shared/types';
import { CUSTOM_PROVIDER_TOKENS } from '@app/shared/common';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @Inject(CUSTOM_PROVIDER_TOKENS.PASSWORD_HASHING_SERVICE)
    private readonly hashingService: HashingAbstractService,
    private configService: ConfigService,
    private jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  private readonly logger = new Logger(AuthService.name);

  async register(
    registerDto: RegisterRequestDto,
  ): Promise<RegisterResponseDto> {
    const { email, password, role, firstName, lastName, status } =
      registerDto || {};

    // Show the user data by logger
    this.logger.log(`
      Register user data: ${JSON.stringify(registerDto, null, 2)}
    `);

    const existingUser = await this.userService.getUserByEmail(email);

    if (existingUser) {
      this.logger.log(`
        User already exists: ${JSON.stringify(existingUser, null, 2)}
      `);

      throw new ConflictException(MESSAGES.USER_ALREADY_EXISTS);
    }

    const hashedPassword = await this.hashingService.hash(password);

    try {
      const userRes = this.usersRepo.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        status,
      } as DeepPartial<User>);

      const savedUser = (await this.usersRepo.save(userRes)) as unknown as User;

      return new RegisterResponseDto({
        id: savedUser.id,
        email: savedUser.email,
        role: savedUser.role,
        status: savedUser.status,
      });
    } catch (error) {
      this.logger.log(`
        [Error] - Error log: ${JSON.stringify(error, null, 2)}
      `);

      throw new InternalServerErrorException('Server error');
    }
  }

  async login(loginDto: LoginRequestDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    // Logger user login
    this.logger.log(`Login user data: ${JSON.stringify(loginDto, null, 2)}`);

    const existingUser = await this.userService.getUserByEmail(email);

    if (!existingUser) {
      this.logger.log(`
        User not found: ${email}
      `);

      throw new NotFoundException(MESSAGES.USER_NOT_FOUND);
    }

    try {
      // compare password
      const isValidPassword = await this.hashingService.compare(
        password,
        existingUser.password,
      );

      if (!isValidPassword) {
        this.logger.log(`
          Login wrong password: ${password})}
        `);

        throw new BadRequestException(MESSAGES.USER_WRONG_PASSWORD);
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

      // store refresh token in DB
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
      this.logger.log(`
        [Error] - Login Error: ${JSON.stringify(error, null, 2)}
      `);

      throw new InternalServerErrorException('Server error');
    }
  }

  async refreshTokens(refreshToken: string) {
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
        this.logger.log(MESSAGES.INVALID_REFRESH_TOKEN);
        throw new UnauthorizedException(MESSAGES.USER_INVALID_REFRESH_TOKEN);
      }

      const isValid = await this.hashingService.compare(
        refreshToken,
        user.refreshToken,
      );

      if (!isValid) {
        this.logger.log(MESSAGES.INVALID_REFRESH_TOKEN);
        throw new UnauthorizedException(MESSAGES.USER_INVALID_REFRESH_TOKEN);
      }

      const newAccessToken = await this.jwtService.signAsync(payload, {
        secret:
          this.configService.get<string>('JWT_SECRET') ?? 'default-secret',
        expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') ||
          '1h') as JwtSignOptions['expiresIn'],
      });

      return { accessToken: newAccessToken };
    } catch (error) {
      this.logger.log(
        `[Error] - Error log: ${MESSAGES.USER_TOKEN_EXPIRED} - ${JSON.stringify(error, null, 2)}`,
      );
      throw new UnauthorizedException(MESSAGES.USER_INVALID_REFRESH_TOKEN);
    }
  }
}
