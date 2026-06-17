import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env';
import { swaggerSpec } from './docs/swagger';
import { errorMiddleware } from './middleware/error.middleware';
import { securityConfig } from './config/security';
import { cacheMiddleware, clearCacheMiddleware } from './middleware/cache.middleware';
import {
  helmetMiddleware,
  apiLimiter,
  authLimiter,
  paymentLimiter,
  uploadLimiter,
  sanitizeInput,
  requestIdMiddleware,
  securityHeadersMiddleware,
  performanceMonitorMiddleware,
  slowRequestMiddleware,
} from './middleware/security.middleware';

import authRoutes from './routes/auth.routes';
import bookRoutes from './routes/book.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import adminRoutes from './routes/admin.routes';

const app: Application = express();

if (securityConfig.trustProxy) {
  app.set('trust proxy', 1);
}

app.use(helmetMiddleware);
app.use(securityHeadersMiddleware);
app.use(requestIdMiddleware);

// Performance monitoring (logs request duration)
if (config.nodeEnv === 'development') {
  app.use(performanceMonitorMiddleware);
  app.use(slowRequestMiddleware(1000)); // Log requests taking > 1 second
}

app.use((req, _res, next) => {
  const rid = req.headers['x-request-id'];
  console.log(
    `[http] ${typeof rid === 'string' ? rid : ''} ${req.method} ${req.originalUrl}`
  );
  next();
});

app.use(cors(securityConfig.cors));

app.use(express.json(securityConfig.bodyParser.json));
app.use(express.urlencoded(securityConfig.bodyParser.urlencoded));

app.use(sanitizeInput);

// Apply cache middleware to GET requests (development only for now)
if (config.nodeEnv === 'development') {
  app.use(cacheMiddleware({ ttl: 30 * 1000 })); // 30 second cache
  app.use(clearCacheMiddleware()); // Clear cache on mutations
}

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'FUBOOKS API Documentation',
    customfavIcon: '/favicon.ico',
  })
);

app.use(apiLimiter);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'FUBOOKS API is running' });
});

app.use('/auth', authLimiter, authRoutes);
app.use('/books', bookRoutes);
app.use('/orders', orderRoutes);
app.use('/payments', paymentLimiter, paymentRoutes);
app.use('/admin', adminRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use(errorMiddleware);

export default app;

