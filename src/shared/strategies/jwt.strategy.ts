// Libs
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy as JwtStrategyBase } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IJwtPayload } from '../types';
import { User } from '@app/apis/users/entities';
import { MESSAGES } from '../constants';
import { handleErrorException } from '../utils/error.utils';
import { JWT_KEYS } from '../common';

@Injectable()
export class JwtStrategy extends PassportStrategy(JwtStrategyBase, 'jwt') {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(JWT_KEYS.JWT_SECRET) || 'secret',
    });
  }

  async validate(payload: IJwtPayload) {
    try {
      // Handle both 'id' and 'sub' fields for compatibility
      const userId = payload.id || payload.sub;
      if (!userId) {
        handleErrorException({
          defaultMessage: MESSAGES.USER_NOT_FOUND,
          ExceptionClass: UnauthorizedException,
        });
      }

      const user = await this.userRepo.findOne({
        where: { id: userId },
        select: ['id', 'email', 'role', 'status', 'firstName', 'lastName'],
      });

      if (!user) {
        handleErrorException({
          defaultMessage: MESSAGES.USER_NOT_FOUND,
          ExceptionClass: UnauthorizedException,
        });
      }

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      handleErrorException({
        defaultMessage: MESSAGES.USER_NOT_FOUND,
        ExceptionClass: UnauthorizedException,
      });
    }
  }
}
