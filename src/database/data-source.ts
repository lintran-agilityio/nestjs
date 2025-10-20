import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { typeOrmConfig } from '../config/typeorm.config';

export const AppDataSource = new DataSource(typeOrmConfig as DataSourceOptions);
