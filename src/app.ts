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

app.use(cors(securityConfig.cors));

app.use(express.json(securityConfig.bodyParser.json));
app.use(express.urlencoded(securityConfig.bodyParser.urlencoded));

app.use(sanitizeInput);

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

