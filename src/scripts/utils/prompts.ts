import * as readline from 'readline';
import { logger } from '@/shared/utils/logger.util';

// Soru sorma yardımcısı
export const askQuestion = (question: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} `, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

// Evet/hayır sorusu
export const askConfirmation = async (question: string): Promise<boolean> => {
  const answer = await askQuestion(`${question} (y/n)`);
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
};

// Listeden seçim yapma
export const askSelection = async <T>(
  question: string,
  options: T[],
  displayFn: (item: T) => string
): Promise<T | null> => {
  logger.info(question);
  
  options.forEach((item, index) => {
    logger.info(`${index + 1}. ${displayFn(item)}`);
  });
  
  const answer = await askQuestion('Enter selection number:');
  const index = parseInt(answer, 10) - 1;
  
  if (isNaN(index) || index < 0 || index >= options.length) {
    logger.error('Invalid selection');
    return null;
  }
  
  return options[index];
};

// Domain sorgusu
export const askDomain = async (): Promise<string> => {
  let domain = await askQuestion('Enter tenant domain (e.g., fitmax-gym):');
  
  // Domaini temizle
  domain = domain.trim().toLowerCase();
  
  if (!domain) {
    logger.error('Domain is required');
    return askDomain();
  }
  
  // Domain formatını doğrula
  if (!/^[a-z0-9]([a-z0-9-]+)?[a-z0-9]$/.test(domain)) {
    logger.error('Invalid domain format. Use lowercase letters, numbers and hyphens only. Cannot start or end with a hyphen.');
    return askDomain();
  }
  
  return domain;
};

// Email sorgusu
export const askEmail = async (): Promise<string> => {
  const email = await askQuestion('Enter email address:');
  
  // Email formatını doğrula
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    logger.error('Invalid email format');
    return askEmail();
  }
  
  return email;
};

// Tenant türü sorgusu
export const askTenantType = async (): Promise<string> => {
  logger.info('Select tenant type:');
  logger.info('1. GYM - Traditional fitness center');
  logger.info('2. STUDIO - Specialized studio (yoga, pilates, etc.)');
  logger.info('3. PERSONAL_TRAINER - Independent trainer');
  logger.info('4. ENTERPRISE - Corporate wellness');
  
  const answer = await askQuestion('Enter selection number:');
  const index = parseInt(answer, 10);
  
  switch (index) {
    case 1: return 'GYM';
    case 2: return 'STUDIO';
    case 3: return 'PERSONAL_TRAINER';
    case 4: return 'ENTERPRISE';
    default:
      logger.error('Invalid selection');
      return askTenantType();
  }
}; 