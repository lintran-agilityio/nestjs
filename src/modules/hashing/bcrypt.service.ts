// Libs
import { Injectable } from '@nestjs/common';
import { compare, genSalt, hash } from 'bcryptjs';

import { HashingAbstractService } from './hashing.abstract.service';

@Injectable()
export class BcryptService implements HashingAbstractService {
  async hash(data: string | Buffer): Promise<string> {
    const salt = await genSalt(10);
    return hash(data.toString(), salt);
  }

  async compare(data: string | Buffer, hash: string): Promise<boolean> {
    return compare(data.toString(), hash);
  }
}
