import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { securityConfig } from '../config/security';

// Apply Helmet security headers
export const helmetMiddleware = helmet(securityConfig.helmet);

// General API rate limiter
export const apiLimiter = rateLimit({
  ...securityConfig.rateLimit,
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});

// Stricter rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Rate limiter for payment endpoints
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many payment requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for file uploads
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: 'Too many file uploads, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Input sanitization middleware
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Recursively sanitize object
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potentially dangerous characters
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

// Request ID middleware for tracking
export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

// Security headers middleware
export const securityHeadersMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const headers = securityConfig.securityHeaders;
  
  Object.entries(headers).forEach(([key, value]) => {
    if (value) {
      res.setHeader(key, value);
    }
  });

  next();
};

// IP whitelist middleware (optional - for admin endpoints)
export const ipWhitelistMiddleware = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.socket.remoteAddress || '';
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      res.status(403).json({
        success: false,
        message: 'Access denied from this IP address',
      });
      return;
    }

    next();
  };
};

