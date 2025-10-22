// libs
import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';

import { AuthService } from './auth.service';
import {
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
} from './dto';
import { Public } from '@app/shared/decorators/public.decorator';
import { ApiCreatedResponseDto, ApiOkResponseDto } from '@app/shared/decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponseDto({
    summary: 'User register',
    description: 'Register successfully',
    type: RegisterResponseDto,
  })
  async register(
    @Body() registerDto: RegisterRequestDto,
  ): Promise<RegisterResponseDto> {
    return await this.authService.register(registerDto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Login',
    description: 'Login successfully',
    type: LoginResponseDto,
  })
  async login(@Body() loginDto: LoginRequestDto): Promise<LoginResponseDto> {
    return await this.authService.login(loginDto);
  }

  @Post('refresh')
  @Public()
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }
}
