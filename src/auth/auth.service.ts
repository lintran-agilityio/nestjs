// libs
import {
  Injectable,
  Logger,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { compare, genSalt, hash } from 'bcryptjs';
import { Repository, DeepPartial } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import {
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
} from './dto';
import { User } from '@app/user/entities';
import { MESSAGES } from '@app/shared/constants';
import { JWT_EXPIRES } from '@app/shared/common';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private configService: ConfigService,
    private jwtService: JwtService,
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

    const existingUser = await this.usersRepo.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      this.logger.log(`
        User already exists: ${JSON.stringify(existingUser, null, 2)}
      `);

      throw new ConflictException(MESSAGES.USER_ALREADY_EXISTS);
    }

    const salt = await genSalt(10);
    const hashedPassword = await hash(password, salt);

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

    try {
      const userRes = await this.usersRepo.findOne({
        where: { email },
      });

      if (!userRes) {
        throw new NotFoundException(MESSAGES.USER_NOT_FOUND);
      }

      // compare password
      if (userRes && !(await compare(password, userRes.password))) {
        throw new UnauthorizedException(MESSAGES.INVALID_CREDENTIALS);
      }

      const payload = {
        id: userRes.id,
        email: userRes.email,
        role: userRes.role,
      };

      const accessTokenExpiresIn =
        this.configService.get<string>(JWT_EXPIRES.JWT_ACCESS_EXPIRES_IN) ??
        '15s';
      const refreshTokenExpiresIn =
        this.configService.get<string>(JWT_EXPIRES.JWT_REFRESH_EXPIRES_IN) ??
        '15s';

      const accessToken = await this.jwtService.signAsync(payload, {
        expiresIn: accessTokenExpiresIn,
      });
      const newRefreshToken = await this.jwtService.signAsync(payload, {
        expiresIn: refreshTokenExpiresIn,
      });
    } catch (error) {
      this.logger.log(`[Error] - Error log: ${JSON.stringify(error, null, 2)}`);

      throw new InternalServerErrorException('Server error');
    }
  }
}
