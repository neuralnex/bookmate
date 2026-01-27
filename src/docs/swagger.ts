import swaggerJsdoc from 'swagger-jsdoc';
import { config } from '../config/env';
import path from 'path';

const isProduction = config.nodeEnv === 'production';
const routesPattern = isProduction
  ? path.join(process.cwd(), 'dist', 'routes', '*.js')
  : path.join(process.cwd(), 'src', 'routes', '*.ts');

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FUBOOKS API',
      version: '1.0.0',
      description: 'Backend API for FUBOOKS - Book ordering system',
      contact: {
        name: 'API Support',
        email: 'support@fubooks.com',
      },
    },
    servers: [
      {
        url: config.nodeEnv === 'production'
          ? process.env.API_URL || `http://localhost:${config.port}`
          : `http://localhost:${config.port}`,
        description: config.nodeEnv === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /auth/login',
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints',
      },
      {
        name: 'Books',
        description: 'Book management endpoints',
      },
      {
        name: 'Orders',
        description: 'Order management endpoints',
      },
      {
        name: 'Admin',
        description: 'Admin-only endpoints',
      },
      {
        name: 'Payments',
        description: 'Payment processing endpoints',
      },
    ],
  },
  apis: [routesPattern],
};

export const swaggerSpec = swaggerJsdoc(options);



