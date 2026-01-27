import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env';
import { swaggerSpec } from './docs/swagger';
import { errorMiddleware } from './middleware/error.middleware';
import { securityConfig } from './config/security';
import {
  helmetMiddleware,
  apiLimiter,
  authLimiter,
  paymentLimiter,
  uploadLimiter,
  sanitizeInput,
  requestIdMiddleware,
  securityHeadersMiddleware,
} from './middleware/security.middleware';

// Routes
import authRoutes from './routes/auth.routes';
import bookRoutes from './routes/book.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import adminRoutes from './routes/admin.routes';

const app: Application = express();

// Trust proxy (for rate limiting behind reverse proxy)
if (securityConfig.trustProxy) {
  app.set('trust proxy', 1);
}

// Security Middleware (apply first)
app.use(helmetMiddleware);
app.use(securityHeadersMiddleware);
app.use(requestIdMiddleware);

// CORS with security configuration
app.use(cors(securityConfig.cors));

// Body parser with size limits
app.use(express.json(securityConfig.bodyParser.json));
app.use(express.urlencoded(securityConfig.bodyParser.urlencoded));

// Input sanitization
app.use(sanitizeInput);

// Swagger Documentation (before rate limiting to avoid issues)
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'FUBOOKS API Documentation',
    customfavIcon: '/favicon.ico',
  })
);

// Global rate limiting
app.use(apiLimiter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'FUBOOKS API is running' });
});

// API Routes with specific rate limiters
app.use('/auth', authLimiter, authRoutes);
app.use('/books', bookRoutes);
app.use('/orders', orderRoutes);
app.use('/payments', paymentLimiter, paymentRoutes);
app.use('/admin', adminRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

export default app;

