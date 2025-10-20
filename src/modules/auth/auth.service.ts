// libs
import {
  Injectable,
  Logger,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
import { User } from '@app/modules/user/entities';
import { MESSAGES } from '@app/shared/constants';
import { HashingService } from '@app/modules/hashing/hashing.service';
import { UserService } from '../user/user.service';
import { IJwtAuthPayload } from '@app/shared/types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly hashingService: HashingService,
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

    const existingUser = await this.userService.findUserByEmail(email);

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

    const existingUser = await this.userService.findUserByEmail(email);

    if (!existingUser) {
      this.logger.log(`
        User not found: ${email}
      `);

      throw new NotFoundException(MESSAGES.USER_NOT_FOUND);
    }

    try {
      // compare password
      const isMatchPassword = await this.hashingService.compare(
        password,
        existingUser.password,
      );

      if (!isMatchPassword) {
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
      const accessToken = await this.jwtService.signAsync(payload);

      return {
        accessToken,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          role: existingUser.role,
          status: existingUser.status,
        },
      };
    } catch (error) {
      this.logger.log(`[Error] - Error log: ${JSON.stringify(error, null, 2)}`);

      throw new InternalServerErrorException('Server error');
    }
  }
}
