// Libs
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

// App sources
import { ApiOkResponseDto, Public, Roles } from '@app/shared/decorators';
import { GetCurrentUser } from '@app/shared/decorators/get-current-user.decorator';
import { QueryPaginationParamDto } from '@app/shared/dtos';
import {
  JwtAuthGuard,
  RolesGuard,
  UserOwnershipProtected,
} from '@app/shared/guards';
import {
  IMessageAndCountResponse,
  IUserInfo,
  UserRole,
} from '@app/shared/types';

// Local sources
import { UpdateAllUsersDto, UpdateUserByIdDto, UserResponseDto } from './dtos';
import { User } from './entities';
import { UserService } from './users.service';
import { PATHS } from '@app/shared/constants';
import { PostPaginationResponseDto } from '../posts/dtos';

const { USER, ADMIN } = UserRole;

@UseInterceptors(ClassSerializerInterceptor)
@Controller(PATHS.USERS)
@ApiBearerAuth()
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
  @Public()
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
   * Get user by ID or email
   * Automatically detects whether the parameter is a UUID or email address
   * - If UUID: users can only access their own profile unless admin
   * - If email: users can only access their own email, admins can access any email
   * @param identifier - The user ID (UUID) or email address
   * @param currentUser - The currently authenticated user
   * @returns User details
   * @throws NotFoundException if user not found
   * @throws BadRequestException if identifier is neither a valid UUID nor email
   * @throws ForbiddenException if user tries to access another user's data
   */
  @Get(':identifier')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Get user info by ID or email',
    description: 'Get user by ID (UUID) or email address successful',
    type: User,
  })
  async getByIdOrEmail(
    @Param('identifier') identifier: string,
    @GetCurrentUser()
    currentUser: IUserInfo,
  ): Promise<User> {
    return this.userService.getByIdOrEmail(identifier, currentUser);
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
    @Param('id', ParseUUIDPipe) id: string,
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
  @Put()
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
  @HttpCode(HttpStatus.NO_CONTENT)
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
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOkResponseDto({
    summary: 'Delete user by ID',
    description: 'Deleted user successfully',
    type: String,
  })
  async deleteById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IMessageAndCountResponse> {
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
  @Delete(':id/posts/:postId')
  @UserOwnershipProtected('id', [ADMIN, USER])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOkResponseDto({
    summary: 'Delete specific user post',
    description: 'Delete a specific post belonging to a user',
    type: String,
  })
  async deletePostById(
    @Param('id', ParseUUIDPipe) userId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
  ): Promise<void> {
    return this.userService.deletePostById(userId, postId);
  }

  @Get(':id/posts')
  @UserOwnershipProtected('id', [ADMIN, USER])
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Get all Post of User',
    description: 'User or Admin can get all Post of owner User',
    type: PostPaginationResponseDto,
  })
  async getAllPostOfUser(
    @Param('id', ParseUUIDPipe) userId: string,
  ): Promise<PostPaginationResponseDto> {
    return await this.userService.getAllPostOfUser(userId);
  }
}
