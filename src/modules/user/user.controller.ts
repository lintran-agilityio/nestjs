// libs
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
  Put,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';

import { UserService } from './user.service';
import {
  UpdateAllUsersDto,
  DeleteAllUsersDto,
  UserResponseDto,
  UpdateUserByIdDto,
} from './dto';
import { User } from './entities';
import { ApiOkResponseDto, Roles } from '@app/shared/decorator';
import { QueryPaginationParamDto } from '@app/shared/dto';
import { IMessageAndCountRepose, UserRole } from '@app/shared/types';
import { OwnUserGuard, RolesGuard } from '@app/shared/guard';
import { JwtAuthGuard } from '@app/shared/guard/jwt.guard';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
// Apply authentication first, then roles guard
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.USER)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Get all user information for ADMIN user role',
    description: 'Get all users successful',
    type: UserResponseDto,
  })
  async getUsers(
    @Query() paramQueryDto: QueryPaginationParamDto,
  ): Promise<UserResponseDto> {
    return await this.userService.getUsers(paramQueryDto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Get user info by id for ADMIN user role',
    description: 'Get users by id successful',
    type: UserResponseDto,
  })
  async getUserById(@Param('id') id: string): Promise<User> {
    return this.userService.findUserById(id);
  }

  @Get('by-email/:email')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Get user info by email for ADMIN user role',
    description: 'Get users by email successful',
    type: UserResponseDto,
  })
  async getUserByEmail(@Param('email') email: string): Promise<User> {
    return this.userService.findUserByEmail(email);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @UseGuards(JwtAuthGuard, RolesGuard, OwnUserGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Update info of user by id',
    description: 'Updated user successful',
    type: User,
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserByIdDto,
  ): Promise<IMessageAndCountRepose> {
    return await this.userService.updateUserById(id, updateUserDto);
  }

  @Put('update-all')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Update multiple users at once',
    description: 'All users updated successfully',
    type: User,
    isArray: true,
  })
  async updateAllUsers(@Body() dto: UpdateAllUsersDto): Promise<User[]> {
    return await this.userService.updateAllUsers(dto);
  }

  @Delete('delete-all')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Delete multiple users',
    description: 'Deleted users successfully',
    type: String,
  })
  async deleteUsers(
    @Body() dto: DeleteAllUsersDto,
  ): Promise<IMessageAndCountRepose> {
    return await this.userService.deleteUsers(dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @UseGuards(JwtAuthGuard, RolesGuard, OwnUserGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Delete user by ID',
    description: 'Deleted user successfully',
    type: String,
  })
  async deleteUsersById(
    @Param('id') id: string,
  ): Promise<IMessageAndCountRepose> {
    return await this.userService.deleteUsersById(id);
  }
}
