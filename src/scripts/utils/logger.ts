import { logger } from '@/shared/utils/logger.util';

// Başlık stili
export const logHeader = (message: string): void => {
  logger.info('');
  logger.info('='.repeat(50));
  logger.info(message);
  logger.info('='.repeat(50));
};

// Alt başlık stili
export const logSubHeader = (message: string): void => {
  logger.info('');
  logger.info('-'.repeat(40));
  logger.info(message);
  logger.info('-'.repeat(40));
};

// Başarı mesajı
export const logSuccess = (message: string): void => {
  logger.info(`✅ ${message}`);
};

// Hata mesajı
export const logError = (message: string, error?: any): void => {
  logger.error(`❌ ${message}`);
  
  if (error) {
    if (typeof error === 'object' && error.message) {
      logger.error(`   Details: ${error.message}`);
    } else {
      logger.error(`   Details: ${error}`);
    }
  }
};

// Uyarı mesajı
export const logWarning = (message: string): void => {
  logger.warn(`⚠️  ${message}`);
};

// Bilgi mesajı
export const logInfo = (message: string): void => {
  logger.info(`ℹ️  ${message}`);
};

// İşlem başlangıcı
export const logStart = (message: string): void => {
  logger.info(`🚀 ${message}...`);
};

// İşlem bitişi
export const logComplete = (message: string): void => {
  logger.info(`✨ ${message} completed!`);
};

// Liste elemanı
export const logListItem = (message: string): void => {
  logger.info(`  • ${message}`);
};

// Detay satırı
export const logDetail = (label: string, value: any): void => {
  logger.info(`   ${label}: ${value}`);
};

// JSON objesi
export const logJson = (label: string, data: any): void => {
  logger.info(`${label}:`);
  logger.info(JSON.stringify(data, null, 2));
}; 