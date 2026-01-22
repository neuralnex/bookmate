import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response';

/**
 * Middleware to validate request data against a Zod schema
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate body, query, and params
      const data = {
        body: req.body,
        query: req.query,
        params: req.params,
      };

      const validated = schema.parse(data);
      
      // Replace original data with validated data
      req.body = validated.body || req.body;
      req.query = validated.query || req.query;
      req.params = validated.params || req.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        
        sendError(
          res,
          'Validation failed',
          400,
          errors.map((e) => `${e.path}: ${e.message}`).join(', ')
        );
        return;
      }
      next(error);
    }
  };
};

/**
 * Middleware to validate UUID format
 */
export const validateUUID = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const value = req.params[paramName];

    if (value && !uuidRegex.test(value)) {
      sendError(res, `Invalid ${paramName} format`, 400);
      return;
    }

    next();
  };
};

/**
 * Middleware to check required fields
 */
export const requireFields = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields: string[] = [];

    fields.forEach((field) => {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      sendError(
        res,
        `Missing required fields: ${missingFields.join(', ')}`,
        400
      );
      return;
    }

    next();
  };
};

