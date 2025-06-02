/**
 * Swagger dokümantasyonu oluşturmak için kullanılan script
 */
import { generateSwaggerFile } from '../shared/utils/swagger.util';
import * as path from 'path';
import { logger } from '@/shared/utils/logger.util';

const outputPath = path.join(__dirname, '../../swagger-output.json');

// Swagger dosyasını oluştur
generateSwaggerFile(outputPath)
  .then(() => {
    logger.info('✅ Swagger documentation has been successfully generated!');
    process.exit(0);
  })
  .catch((error) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Error generating Swagger documentation: ${errorMessage}`);
    process.exit(1);
  });
