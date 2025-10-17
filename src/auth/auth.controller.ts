// libs
import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import {
  ApiOperation,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { RegisterRequestDto, RegisterResponseDto } from './dto';
import { Public } from '@app/shared/decorators/public.decorator';
import { ErrorResponseDto } from '@app/shared/dto';

@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registerUser')
  @Public()
  @ApiOperation({ summary: 'Register' })
  @ApiBody({
    description: 'Register',
    type: RegisterRequestDto,
  })
  @ApiCreatedResponse({
    description: 'Register successfully',
    type: RegisterResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Bad request',
    type: ErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Conflict and Existing',
    type: ErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  @HttpCode(HttpStatus.ACCEPTED)
  async registerUser(
    @Body() registerDto: RegisterRequestDto,
  ): Promise<RegisterResponseDto> {
    return await this.authService.register(registerDto);
  }
}
