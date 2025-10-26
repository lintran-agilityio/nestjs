// libs
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy as JwtStrategyBase } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IJwtPayload } from '../types';
import { User } from '@app/modules/user/entities';
import { MESSAGES } from '../constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(JwtStrategyBase, 'jwt') {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secret',
    });
  }

  async validate(payload: IJwtPayload) {
    try {
      // Handle both 'id' and 'sub' fields for compatibility
      const userId = payload.id || payload.sub;
      if (!userId) {
        throw new UnauthorizedException(MESSAGES.USER_NOT_FOUND);
      }

      const user = await this.userRepo.findOne({
        where: { id: userId },
        select: ['id', 'email', 'role', 'status', 'firstName', 'lastName'],
      });

      if (!user) {
        throw new UnauthorizedException(MESSAGES.USER_NOT_FOUND);
      }

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(MESSAGES.USER_NOT_FOUND);
    }
  }
}
