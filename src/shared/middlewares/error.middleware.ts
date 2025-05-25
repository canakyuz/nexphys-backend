import { Request, Response, NextFunction } from 'express';
import { logger } from '@/shared/utils/logger.util';
import { ResponseUtil } from '@/shared/utils/response.util';
import { envConfig } from '@/config/env.config';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }

  // Log error
  logger.error({
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    statusCode,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  });

  // Send error response
  return ResponseUtil.error(
    res,
    message,
    envConfig.NODE_ENV === 'development' ? error.stack : undefined,
    statusCode,
  );
};

export const notFoundHandler = (req: Request, res: Response) => {
  return ResponseUtil.error(
    res,
    `Route ${req.originalUrl} not found`,
    null,
    404
  );
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
