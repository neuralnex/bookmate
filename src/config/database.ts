import { DataSource } from 'typeorm';
import path from 'path';
import { config } from './env';
import { User } from '../entities/User';
import { Book } from '../entities/Book';
import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';

// Determine if SSL is needed (for cloud databases like Render.com)
const needsSSL =
  config.database.url.includes('neon.tech') ||
  config.database.url.includes('render.com') ||
  config.database.url.includes('amazonaws.com') ||
  config.database.url.includes('azure.com') ||
  process.env.DATABASE_SSL === 'true';

const migrationExt = __filename.endsWith('.js') ? 'js' : 'ts';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: config.database.url,
  synchronize: config.nodeEnv === 'development',
  logging: config.nodeEnv === 'development',
  migrationsRun: true,
  entities: [User, Book, Order, OrderItem],
  migrations: [path.join(__dirname, '..', 'migrations', `*.${migrationExt}`)],
  subscribers: [],
  // Connection pooling for better performance
  poolSize: 20,
  connectTimeoutMS: 5000,
  ...(needsSSL && {
    ssl: {
      rejectUnauthorized: false,
    },
  }),
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
};

