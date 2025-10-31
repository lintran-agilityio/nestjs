import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { runSeeders } from 'typeorm-extension';

import { AppDataSource } from './data-source.config';
import MainSeeder from './seeding/seeds/main.seeder';

// Register factories (side-effect imports)
import './seeding/factories/user.factory';
import './seeding/factories/post.factory';
import './seeding/factories/comment.factory';

const logger = new Logger('SeedScript');

const bootstrap = async (): Promise<void> => {
  const dataSource = await AppDataSource.initialize();
  try {
    await runSeeders(dataSource, { seeds: [MainSeeder] });
    logger.log('Seeding complete');
  } catch (error) {
    logger.error('Seeding failed', error as Error);
    process.exitCode = 1;
  } finally {
    await dataSource.destroy();
  }
};

void bootstrap();
