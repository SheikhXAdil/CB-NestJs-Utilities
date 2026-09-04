// src/db/data-source.ts
import { config } from 'dotenv';
import { join } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [join(process.cwd(), 'dist/**/*.entity.js')],
  synchronize: false,
  migrationsRun: true,
  migrations: [join(process.cwd(), 'dist/db/migrations/*.js')],
  migrationsTableName: 'migrations',
  namingStrategy: new SnakeNamingStrategy(),
  // logging: true,
};

export const connectionSource = new DataSource(dataSourceOptions);
