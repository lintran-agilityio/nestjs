// libs
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy as JwtStrategyBase } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';

import { IJwtPayload } from '../types';
import { User } from '@app/modules/user/entities';
import { MESSAGES } from '../constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(JwtStrategyBase, 'jwt') {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {
    console.log('=== JWT TOKEN ===', ExtractJwt.fromAuthHeaderAsBearerToken());

    super({
      jwtFromRequest: (req: Request) => {
        const authHeader = req.headers.authorization;
        console.log('=== AUTH HEADER ===', authHeader)

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          console.warn('⚠️ Missing or invalid Authorization header');
          return null;
        }

        const token = authHeader.split(' ')[1];
        console.log('🔑 Extracted JWT token:', token);
        return token;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secret',
    });
  }

  async validate(payload: IJwtPayload) {
    // Handle both 'id' and 'sub' fields for compatibility
    const userId = payload.id || payload.sub;
    if (!userId) {
      throw new UnauthorizedException(MESSAGES.USER_NOT_FOUND);
    }
    
    const user = await this.userRepo.findOne({ where: { id: userId } });
    console.log('===== JWT STRATEGY ======', user)
    if (!user) throw new UnauthorizedException(MESSAGES.USER_NOT_FOUND);
    return user;
  }
}
