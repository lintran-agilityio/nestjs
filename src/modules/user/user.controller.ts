// Libs
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';

// App sources
import { ApiOkResponseDto, Roles } from '@app/shared/decorators';
import { QueryPaginationParamDto } from '@app/shared/dto';
import {
  JwtAuthGuard,
  RolesGuard,
  UserOwnershipProtected,
} from '@app/shared/guard';
import { IMessageAndCountResponse, UserRole } from '@app/shared/types';

// Local sources
import { UpdateAllUsersDto, UpdateUserByIdDto, UserResponseDto } from './dto';
import { User } from './entities';
import { UserService } from './user.service';

const { USER, ADMIN } = UserRole;

@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Get all users with pagination
   * @param paramQueryDto - Query parameters for pagination, sorting, and filtering
   * @returns Paginated list of users
   * @throws InternalServerErrorException on server error
   */
  @Get()
  @Roles(ADMIN, USER)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Get all users',
    description: 'Get all users successful',
    type: UserResponseDto,
  })
  async getUsers(
    @Query() paramQueryDto: QueryPaginationParamDto,
  ): Promise<UserResponseDto> {
    return await this.userService.getAll(paramQueryDto);
  }

  /**
   * Get user by ID
   * @param id - The user ID
   * @returns User details
   * @throws NotFoundException if user not found
   */
  @Get(':id')
  @Roles(ADMIN, USER)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Get user info by id',
    description: 'Get users by id successful',
    type: User,
  })
  async getById(@Param('id') id: string): Promise<User> {
    return this.userService.getById(id);
  }

  /**
   * Get user by email
   * @param email - The user email
   * @returns User details
   * @throws NotFoundException if user not found
   */
  @Get(':email')
  @Roles(ADMIN, USER)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Get user info by email',
    description: 'Get users by email successful',
    type: User,
  })
  async getByEmail(@Param('email') email: string): Promise<User> {
    return this.userService.getByEmail(email);
  }

  /**
   * Update user by ID
   * @param id - The user ID
   * @param updateUserDto - Updated user data
   * @returns Success message
   * @throws NotFoundException if user not found
   * @throws InternalServerErrorException on server error
   */
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
    return await this.userService.updateById(id, updateUserDto);
  }

  /**
   * Update multiple users at once
   * @param dto - DTO containing array of users to update
   * @returns Array of updated users
   * @throws InternalServerErrorException on server error
   */
  @Put('update-all')
  @Roles(ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Update multiple users at once',
    description: 'All users updated successfully',
    type: User,
    isArray: true,
  })
  async updateAll(@Body() dto: UpdateAllUsersDto): Promise<User[]> {
    return await this.userService.updateAll(dto);
  }

  /**
   * Delete all users
   * @returns Success message with deletion count
   * @throws NotFoundException if no users found
   * @throws InternalServerErrorException on server error
   */
  @Delete()
  @Roles(ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Delete all users',
    description: 'Deleted users successfully',
    type: String,
  })
  async deleteAll(): Promise<IMessageAndCountResponse> {
    return await this.userService.deleteAll();
  }

  /**
   * Delete a user by ID
   * @param id - The user ID
   * @returns Success message
   * @throws NotFoundException if user not found
   * @throws InternalServerErrorException on server error
   */
  @Delete(':id')
  @UserOwnershipProtected('id', [UserRole.ADMIN, UserRole.USER])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Delete user by ID',
    description: 'Deleted user successfully',
    type: String,
  })
  async deleteById(@Param('id') id: string): Promise<IMessageAndCountResponse> {
    return await this.userService.deleteById(id);
  }

  /**
   * Delete user's post by ID
   * @param userId - The user ID
   * @param postId - The post ID
   * @returns Success message
   * @throws NotFoundException if post not found
   * @throws InternalServerErrorException on server error
   */
  @Delete(':id/post/:postId')
  @UserOwnershipProtected('id', [ADMIN, USER])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Delete specific user post',
    description: 'Delete a specific post belonging to a user',
    type: String,
  })
  async deletePostById(
    @Param('id') userId: string,
    @Param('postId') postId: string,
  ): Promise<IMessageAndCountResponse> {
    return await this.userService.deletePostById(userId, postId);
  }
}
