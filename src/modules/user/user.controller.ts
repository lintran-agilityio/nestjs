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
import { IMessageAndCountResponse, UserRole } from '@app/shared/types';
import {
  RolesGuard,
  JwtAuthGuard,
  UserOwnershipProtected,
} from '@app/shared/guard';

const { USER, ADMIN } = UserRole;
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(ADMIN, USER)
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
  @Roles(ADMIN, USER)
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
  @Roles(ADMIN, USER)
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
  @UserOwnershipProtected('id', [UserRole.ADMIN, UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Update info of user by id',
    description: 'Updated user successful',
    type: User,
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserByIdDto,
  ): Promise<IMessageAndCountResponse> {
    return await this.userService.updateUserById(id, updateUserDto);
  }

  @Put('update-all')
  @Roles(ADMIN)
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
  @Roles(ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Delete multiple users',
    description: 'Deleted users successfully',
    type: String,
  })
  async deleteUsers(
    @Body() dto: DeleteAllUsersDto,
  ): Promise<IMessageAndCountResponse> {
    return await this.userService.deleteUsers();
  }

  @Delete(':id')
  @UserOwnershipProtected('id', [UserRole.ADMIN, UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Delete user by ID',
    description: 'Deleted user successfully',
    type: String,
  })
  async deleteUsersById(
    @Param('id') id: string,
  ): Promise<IMessageAndCountResponse> {
    return await this.userService.deleteUsersById(id);
  }

  // Delete User post by id
  @Delete(':id/post/:postId')
  @UserOwnershipProtected('id', [ADMIN, USER])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Delete specific user post',
    description: 'Delete a specific post belonging to a user',
    type: String,
  })
  async deleteUserPostById(
    @Param('id') userId: string,
    @Param('postId') postId: string,
  ): Promise<IMessageAndCountResponse> {
    return await this.userService.deleteUserPostById(userId, postId);
  }
}
