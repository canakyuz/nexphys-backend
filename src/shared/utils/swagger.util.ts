import swaggerJSDoc from 'swagger-jsdoc';
import { envConfig } from '@/config/env.config';

/**
 * Swagger yapılandırması için merkezi bir yapı sağlar
 * Tüm Swagger doküman oluşturma işlemlerini tek bir yerden yönetir
 */
export const generateSwaggerSpec = () => {
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'NexPhys API',
        version: '1.0.0',
        description: 'NexPhys API documentation',
      },
      servers: [
        {
          url: `http://localhost:${envConfig.PORT}${envConfig.API_PREFIX}`,
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    apis: ['./src/modules/**/routes/*.ts'],
  };

  return swaggerJSDoc(options);
};

/**
 * Swagger dokümanlarını otomatik olarak oluşturmak için yardımcı fonksiyon
 * CI/CD pipeline'ında veya build sürecinde kullanılabilir
 */
export const generateSwaggerFile = async (outputPath: string): Promise<void> => {
  const fs = require('fs');
  const swaggerSpec = generateSwaggerSpec();
  
  try {
    fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
    // Swagger documentation generated successfully
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};
