import { Sequelize } from 'sequelize';
import type { Options } from 'sequelize';

import { config } from '@/libs/config';

export const sequelize = new Sequelize(config.database, config.username, config.password, config.params as Options);
