// Libs
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

// App sources
import {
  ApiCreatedResponseDto,
  ApiOkResponseDto,
  Public,
} from '@app/shared/decorators';

// Local sources
import {
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
} from './dto';
import { AuthService } from './auth.service';
import { PATHS } from '@app/shared/constants';

@Controller(PATHS.AUTH)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   * @param registerDto - User registration data
   * @returns Registered user information
   * @throws ConflictException if user already exists
   * @throws InternalServerErrorException on server error
   */
  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponseDto({
    summary: 'Register a new user',
    description:
      'Create a new user account with email, password, and other details',
    type: RegisterResponseDto,
  })
  async register(
    @Body() registerDto: RegisterRequestDto,
  ): Promise<RegisterResponseDto> {
    return await this.authService.register(registerDto);
  }

  /**
   * Authenticate user and return access tokens
   * @param loginDto - User login credentials (email and password)
   * @returns Access token, refresh token, and user information
   * @throws UnauthorizedException if user not found or invalid credentials
   * @throws BadRequestException if password is incorrect
   * @throws InternalServerErrorException on server error
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'User login',
    description:
      'Authenticate user with email and password to receive access and refresh tokens',
    type: LoginResponseDto,
  })
  async login(@Body() loginDto: LoginRequestDto): Promise<LoginResponseDto> {
    return await this.authService.login(loginDto);
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken - The refresh token string
   * @returns New access token
   * @throws UnauthorizedException if refresh token is invalid or expired
   */
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Refresh access token',
    description: 'Get a new access token using a valid refresh token',
    type: Object,
  })
  async refresh(
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return await this.authService.refreshTokens(refreshToken);
  }
}
