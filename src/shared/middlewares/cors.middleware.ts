import cors from 'cors';
import { envConfig } from '@/config/env.config';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (envConfig.CORS_ORIGIN.includes(origin)) {
      return callback(null, true);
    }

    // Allow any localhost or IP for development
    if (envConfig.NODE_ENV === 'development') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.')) {
        return callback(null, true);
      }
    }

    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: envConfig.CORS_CREDENTIALS,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Tenant-Domain',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
});
