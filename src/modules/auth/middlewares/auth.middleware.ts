import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@/shared/services/jwt.services';
import { AppError } from '@/shared/middlewares/error.middleware';
import { AuthenticatedRequest } from '../controllers/auth.controller';

const jwtService = new JwtService();

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token is required', 401);
    }

    const token = authHeader.substring(7);
    const payload = jwtService.verifyAccessToken(token);

    // Verify tenant matches
    const tenantDomain = req.headers['x-tenant-domain'] as string;
    if (payload.tenantDomain !== tenantDomain) {
      throw new AppError('Token tenant mismatch', 403);
    }

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Invalid or expired token', 401));
    }
  }
};