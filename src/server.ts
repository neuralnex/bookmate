import 'reflect-metadata';
import app from './app';
import { config } from './config/env';
import { initializeDatabase } from './config/database';

const startServer = async (): Promise<void> => {
  try {
    // Initialize database connection
    await initializeDatabase();

    // Start server
    app.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`);
      console.log(`API Documentation: http://localhost:${config.port}/api-docs`);
      console.log(`Health Check: http://localhost:${config.port}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

