import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  if (req.user.role !== 'admin') {
    sendError(res, 'Admin access required', 403);
    return;
  }

  next();
};

