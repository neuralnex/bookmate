import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/bookmate',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  opay: {
    merchantId: process.env.OPAY_MERCHANT_ID || '',
    publicKey: process.env.OPAY_PUBLIC_KEY || '', // Used for payment creation
    secretKey: process.env.OPAY_SECRET_KEY || '', // Used for signature-based APIs
    baseUrl: process.env.OPAY_BASE_URL || (process.env.NODE_ENV === 'production' 
      ? 'https://liveapi.opaycheckout.com'
      : 'https://testapi.opaycheckout.com'),
    callbackUrl: process.env.OPAY_CALLBACK_URL || 'http://localhost:3000/payments/callback',
    returnUrl: process.env.OPAY_RETURN_URL || 'http://localhost:3000/payments/return',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
};

