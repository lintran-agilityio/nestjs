import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryParamDto } from './dto';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserResponseDto } from './dto/get-user-response.dto';
import { MESSAGES } from '@app/shared/constants';
import { User } from './entities';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all user information for ADMIN user role' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get all users info successful',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: MESSAGES.INVALID_VALIDATION,
  })
  @ApiUnauthorizedResponse({
    description: MESSAGES.INVALID_TOKEN,
  })
  async getUsers(
    @Query() paramQueryDto: UserQueryParamDto,
  ): Promise<UserResponseDto> {
    return await this.userService.getUsers(paramQueryDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user info by id for ADMIN user role' })
  @ApiParam({ name: 'id', type: String, description: 'Id of user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get users by id successful',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: MESSAGES.INVALID_VALIDATION,
  })
  @ApiNotFoundResponse({
    description: MESSAGES.USER_NOT_FOUND,
  })
  async getUserById(@Param('id') id: string): Promise<User> {
    return this.userService.getUserById(id);
  }

  @Get(':email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get user info by email for ADMIN user role' })
  @ApiParam({ name: 'email', type: String, description: 'Email of user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Get users by email successful',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({
    description: MESSAGES.INVALID_VALIDATION,
  })
  @ApiNotFoundResponse({
    description: MESSAGES.USER_NOT_FOUND,
  })
  async getUserByEmail(@Param('email') email: string): Promise<User> {
    return this.userService.getUserById(email);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUserById(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.deleteUsersById(id);
  }
}
