import swaggerJSDoc from 'swagger-jsdoc';
import swaggerAutogen from 'swagger-autogen';
import { envConfig } from './env.config';

// Basitleştirilmiş otomatik swagger konfigürasyonu
const outputFile = './swagger-output.json';
const endpointsFiles = [
  './src/modules/**/routes/*.ts',
];

const doc = {
  info: {
    title: 'NexPhys API',
    version: '1.0.0',
    description: 'NexPhys API documentation',
  },
  host: `localhost:${envConfig.PORT}`,
  basePath: '/api',
  schemes: [envConfig.NODE_ENV === 'production' ? 'https' : 'http'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description: 'Enter JWT Bearer token **_only_**',
    },
  },
  definitions: {
    // Temel model tanımları otomatik oluşturulacak
  },
};

// Swagger otomatik oluşturma fonksiyonu
export const generateSwaggerDocs = async () => {
  await swaggerAutogen()(outputFile, endpointsFiles, doc);
};

// Mevcut JSDoc tabanlı yapılandırma (geriye dönük uyumluluk için)
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'NexPhys API',
    version: '1.0.0',
    description: 'NexPhys API documentation',
  },
  servers: [
    {
      url: `${envConfig.NODE_ENV === 'production' ? 'https' : 'http'}://localhost:${envConfig.PORT}/api`,
      description: 'NexPhys API Server',
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
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: [
    './src/modules/**/routes/*.ts',
    './src/modules/**/dto/*.ts',
    './src/types/models/*.ts',
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
