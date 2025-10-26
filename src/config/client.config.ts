// Libs
import { ConfigService } from '@nestjs/config';

import { DataSourceOptions } from 'typeorm';

export const clientConfig = async (
  configService: ConfigService,
): Promise<DataSourceOptions> => {
  return Promise.resolve({
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USER'),
    password: configService.get<string>('DB_PASS'),
    database: configService.get<string>('DB_NAME'),
    autoLoadEntities: true,
    synchronize: false,
    migrations: [__dirname + '/../migrations/*.{ts,js}'],
  });
};
