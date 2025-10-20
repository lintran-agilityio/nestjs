// libs
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { User } from '../modules/user/entities/user.entity';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  database: process.env.DB_NAME || 'fake_social',
  entities: [User],
  synchronize: true,
  migrations: ['./src/database/migrations/*.ts'],
  logging: true,
};
