import { config } from './env';

export const securityConfig = {
  // Rate limiting configuration
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: config.nodeEnv === 'production' ? 100 : 1000, // requests per window
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Helmet security headers
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", config.opay.baseUrl],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' as const },
  },

  // CORS configuration
  cors: {
    origin: config.cors.origin === '*' ? true : config.cors.origin.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
    maxAge: 86400, // 24 hours
  },

  // Request size limits
  bodyParser: {
    json: {
      limit: '10mb',
      strict: true,
    },
    urlencoded: {
      limit: '10mb',
      extended: true,
      parameterLimit: 1000,
    },
  },

  // Trust proxy (for rate limiting behind reverse proxy)
  trustProxy: config.nodeEnv === 'production',

  // Security headers
  securityHeaders: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': config.nodeEnv === 'production' 
      ? 'max-age=31536000; includeSubDomains; preload'
      : undefined,
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  },
};

