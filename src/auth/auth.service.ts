// libs
import { Injectable, Logger } from '@nestjs/common';
import { genSalt, hash } from 'bcryptjs';
import { eq, type InferInsertModel } from 'drizzle-orm';
import { TransactionHost } from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../database/schema';

// db
import { usersSchema } from '../database/schema/userSchema';
import { RegisterRequestDto, RegisterResponseDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly txHost: TransactionHost<
      TransactionalAdapterDrizzleOrm<NodePgDatabase<typeof schema>>
    >,
  ) {}

  private readonly logger = new Logger(AuthService.name);

  private getDb(): NodePgDatabase<typeof schema> {
    return this.txHost.tx;
  }

  async register(dto: RegisterRequestDto): Promise<RegisterResponseDto> {
    // Show the user data by logger
    this.logger.log(`Register user data: ${JSON.stringify(dto, null, 2)}`);

    const db = this.getDb();

    const existingUser = await db.query.usersSchema.findFirst({
      where: eq(usersSchema.email, dto.email),
    });

    if (existingUser) {
      this.logger.log(`
        User already exists: ${JSON.stringify(existingUser, null, 2)}
      `);
    }

    const salt = await genSalt(10);
    const hashedPassword = await hash(dto.password, salt);

    try {
      const newUserData: InferInsertModel<typeof usersSchema> = {
        ...dto,
        password: hashedPassword,
      };
      const [newUser] = await db
        .insert(usersSchema)
        .values(newUserData)
        .returning();

      return new RegisterResponseDto({
        id: String(newUser.id),
        email: newUser.email,
        status: newUser.status,
      });
    } catch (error) {
      this.logger.log(`
        [Error] - Error log: ${JSON.stringify(error, null, 2)}
      `);
      throw error;
    }
  }
}
