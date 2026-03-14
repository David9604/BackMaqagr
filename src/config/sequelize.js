import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../.env');

dotenv.config({ path: envPath });

export const sequelize = new Sequelize(
  process.env.DB_NAME || 'MaqAgr',
  process.env.DB_USER || 'postgres',
  String(process.env.DB_PASS || ''),
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging: false,
    pool: {
      max: process.env.NODE_ENV === 'test' ? 1 : 5,
      min: 0,
      idle: 1000,
      acquire: 30000,
      evict: 1000,
    },
  },
);

export const closeSequelize = async () => {
  await sequelize.close();
};

export default sequelize;
