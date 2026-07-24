import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config(); // load .env variables

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false, // Migrations should be used instead of synchronize in production
};

export default new DataSource(dataSourceOptions);
