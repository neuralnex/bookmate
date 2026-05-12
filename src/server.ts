import 'reflect-metadata';
import app from './app';
import { assertRequiredEnv, config } from './config/env';
import { initializeDatabase } from './config/database';

const startServer = async (): Promise<void> => {
  try {
    assertRequiredEnv();
    // Initialize database connection
    await initializeDatabase();

    // Start server
    // Bind all interfaces — required on Render/Fly/other hosts where probes hit the runtime PORT from outside localhost-only binding.
    const port = Number(config.port);
    app.listen(Number.isFinite(port) ? port : 3000, '0.0.0.0', () => {
      const p = Number.isFinite(port) ? port : 3000;
      console.log(`Server listening on http://0.0.0.0:${p}`);
      console.log(`API Documentation: http://localhost:${p}/api-docs`);
      console.log(`Health Check: http://localhost:${p}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

