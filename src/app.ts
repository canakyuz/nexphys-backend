
import 'reflect-metadata';
import express from 'express';
import { envConfig } from '@/config/env.config';
import { corsMiddleware } from '@/shared/middlewares/cors.middleware';
import { errorHandler, notFoundHandler } from '@/shared/middlewares/error.middleware';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec, generateSwaggerDocs } from '@/config/swagger.config';
import * as fs from 'fs';

// Import routes
import { authRoutes } from '@/modules/auth/routes/auth.routes';
// Import other routes as needed

export const createApp = (): express.Application => {
  const app = express();

  // Basic middlewares
  app.use(corsMiddleware);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes with /api prefix
  const apiRouter = express.Router();
  app.use('/api', apiRouter);
  
  // Mount routes
  apiRouter.use('/auth', authRoutes);
  // Add other routes here with their respective paths
  
  // Swagger Documentation
  if (envConfig.NODE_ENV !== 'production') {
    // Basitleştirilmiş Swagger yapılandırması için
    try {
      // swagger-output.json dosyası yoksa oluştur
      if (!fs.existsSync('./swagger-output.json')) {
        generateSwaggerDocs();
      }
      
      // Swagger UI'ı yapılandır
      const swaggerDocument = require('../../swagger-output.json');
      app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    } catch (error) {
      // Hata durumunda mevcut swaggerSpec'i kullan
      app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
      
      console.warn('Otomatik Swagger yapılandırması yüklenemedi, manuel yapılandırma kullanılıyor:', error);
    }
    
    // Expose swagger.json
    app.get('/swagger.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });
  }

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};