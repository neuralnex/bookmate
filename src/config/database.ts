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

// Extract SSL mode from environment or use verify-full for production SSL connections
const getSslConfig = () => {
  // If DATABASE_SSL_MODE is explicitly set, use it
  if (process.env.DATABASE_SSL_MODE) {
    return { ssl: { mode: process.env.DATABASE_SSL_MODE } };
  }
  
  // For cloud providers, use verify-full to maintain security
  if (needsSSL) {
    return {
      ssl: {
        mode: 'verify-full',
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    };
  }
  
  // For local development without SSL
  return {};
};

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
  // Add retry logic for connection failures
  extra: {
    connectionLimit: 20,
    maxLifetime: 30000,
    idleTimeout: 10000,
    queueLimit: 0,
  },
  ...getSslConfig(),
});

// Retry configuration for database connection
const RETRY_DELAY_MS = 5000;
const MAX_RETRIES = 3;

export const initializeDatabase = async (): Promise<void> => {
  let retries = 0;
  let lastError: unknown;

  while (retries < MAX_RETRIES) {
    try {
      await AppDataSource.initialize();
      console.log('Database connected successfully');
      return;
    } catch (error) {
      lastError = error;
      retries++;
      if (retries < MAX_RETRIES) {
        console.error(`Database connection failed (attempt ${retries}/${MAX_RETRIES}), retrying in ${RETRY_DELAY_MS}ms...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        console.error('Error connecting to database:', error);
      }
    }
  }

  throw lastError;
};

