import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';
import { UserRole } from '../entities/User';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(
    payload,
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn,
    } as SignOptions
  );
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, config.jwt.secret) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

