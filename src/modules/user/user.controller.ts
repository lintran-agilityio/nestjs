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
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateAllUsersDto, UpdateUserDto } from './dto/update-user.dto';
import { DeleteAllUsersDto } from './dto';
import { UserResponseDto } from './dto';
import { User } from './entities';
import { ApiOkResponseDto } from '@app/shared/decorator';
import { QueryPaginationParamDto } from '@app/shared/dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
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
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Update info of user by id',
    description: 'Updated user successful',
    type: User,
  })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.userService.updateUserById(id, updateUserDto);
  }

  @Put('update-all')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Update multiple users at once',
    description: 'All users updated successfully',
    type: User,
    isArray: true,
  })
  async updateAllUsers(@Body() dto: UpdateAllUsersDto) {
    return await this.userService.updateAllUsers(dto);
  }

  @Delete('delete-all')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Delete multiple users',
    description: 'Deleted users successfully',
    type: String,
  })
  async deleteUsers(
    @Body() dto: DeleteAllUsersDto,
  ): Promise<{ message: string; count: number }> {
    return await this.userService.deleteUsers(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseDto({
    summary: 'Delete user by ID',
    description: 'Deleted user successfully',
    type: String,
  })
  async deleteUsersById(@Param('id') id: string): Promise<{ message: string }> {
    return await this.userService.deleteUsersById(id);
  }
}
