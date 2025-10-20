// libs
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  findAll() {
    return `This action returns all user`;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.usersRepo.findOne({
      where: { email },
    });
  }

  async findUserById(id: string): Promise<User | null> {
    return await this.usersRepo.findOne({
      where: { id },
    });
  }

  async updateRefreshToken(id: string, refreshToken: string) {
    await this.usersRepo.update(id, { refreshToken });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.usersRepo.update(id, updateUserDto);
    return this.usersRepo.findOne({ where: { id } });
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
