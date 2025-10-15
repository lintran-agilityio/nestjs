import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('MYSQL_HOST', 'localhost'),
        port: parseInt(configService.get('MYSQL_PORT', '3306'), 10),
        database: configService.get('MYSQL_DATABASE', 'example_db'),
        username: configService.get('MYSQL_USERNAME', 'root'),
        password: configService.get('MYSQL_PASSWORD', 'example_password'),
        autoLoadEntities: true,
        synchronize: configService.get('MYSQL_SYNCHRONIZE', 'true') === 'true',
        logging: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
