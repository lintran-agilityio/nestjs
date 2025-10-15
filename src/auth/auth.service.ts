// libs
import { Injectable } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateAuthDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  create(createUserDto: CreateUserDto) {
    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
