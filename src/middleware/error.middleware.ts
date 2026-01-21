import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { QueryFailedError } from 'typeorm';
import { sendError } from '../utils/response';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  console.error('Error:', err);

  // Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    return sendError(res, 'Validation failed', 400, errors.join(', '));
  }

  // TypeORM database errors
  if (err instanceof QueryFailedError) {
    // Duplicate email or unique constraint violation
    if (err.message.includes('duplicate key') || err.message.includes('UNIQUE')) {
      return sendError(res, 'Duplicate entry', 409, 'This record already exists');
    }
    return sendError(res, 'Database error', 500, 'An error occurred while processing your request');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return sendError(res, 'Invalid or expired token', 401);
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    if (err.message === 'File too large') {
      return sendError(res, 'File too large', 400, 'Maximum file size is 100MB');
    }
    if (err.message === 'Unexpected field') {
      return sendError(res, 'Invalid file field', 400, 'File field must be named "coverImage"');
    }
    return sendError(res, 'File upload error', 400, err.message);
  }

  // File type validation errors
  if (err.message && err.message.includes('Only image files are allowed')) {
    return sendError(res, 'Invalid file type', 400, 'Only image files are allowed (png, jpg, jpeg, gif, webp)');
  }

  // Default error
  return sendError(
    res,
    err.message || 'Internal server error',
    500,
    process.env.NODE_ENV === 'development' ? err.stack : undefined
  );
};

