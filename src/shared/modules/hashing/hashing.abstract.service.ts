// Libs
import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class HashingAbstractService {
  abstract hash(data: string | Buffer): Promise<string>;
  abstract compare(data: string | Buffer, hash: string): Promise<boolean>;
}
