
import 'reflect-metadata';
import express from 'express';
import { envConfig } from '@/config/env.config';
import { corsMiddleware } from '@/shared/middlewares/cors.middleware';
import { errorHandler, notFoundHandler } from '@/shared/middlewares/error.middleware';

export const createApp = (): express.Application => {
  const app = express();

  // Basic middlewares
  app.use(corsMiddleware);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes will be added here

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};