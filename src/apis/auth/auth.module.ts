// Libs
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

// App sources
import { BcryptService } from '@app/shared/modules/hashing/bcrypt.service';
import { User } from '@app/apis/users/entities';
import { UserModule } from '@app/apis/users/users.module';
import { CUSTOM_PROVIDER_TOKENS, JWT_KEYS } from '@app/shared/common';
import { JwtStrategy } from '@app/shared/strategies';
import { CacheProvider } from '@app/shared/types';

// Local sources
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CacheModule } from '@app/shared/modules/cache/cache.module';

/**
 * Authentication module
 * Handles user registration, login, and token refresh
 * Provides JWT authentication strategy and password hashing service
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.get<string>(JWT_KEYS.JWT_SECRET),
        signOptions: {
          expiresIn: config.get<number>(JWT_KEYS.JWT_EXPIRES_IN),
        },
      }),
    }),
    UserModule,
    CacheModule.register(CacheProvider.REDIS),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: CUSTOM_PROVIDER_TOKENS.PASSWORD_HASHING_SERVICE,
      useClass: BcryptService,
    },
    JwtStrategy,
  ],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
