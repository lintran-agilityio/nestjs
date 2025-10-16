// libs
import { Controller, Post, Body, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiBody,
  ApiResponse,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
  ApiNoContentResponse,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { RegisterRequestDto, RegisterResponseDto } from './dto/register.dto';
import { Public } from '@app/shared/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registerUser')
  @Public()
  @ApiOperation({ summary: 'Register' })
  @ApiBody({
    description: 'Register',
    type: RegisterRequestDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Register successfully',
    type: RegisterResponseDto,
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request',

  })
  async registerUser(@Body() dto: RegisterRequestDto) {
    return await this.authService.register(dto);
  }
}
