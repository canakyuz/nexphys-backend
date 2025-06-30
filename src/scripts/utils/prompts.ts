import * as readline from 'readline';
import * as Logger from './logger';

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

// Genel girdi alıcı
export const askInput = async (prompt: string, required = true): Promise<string> => {
  let input = await askQuestion(prompt);
  input = input.trim();
  
  if (required && !input) {
    Logger.logError('This field is required');
    return askInput(prompt, required);
  }
  
  return input;
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
  Logger.logInfo(question);
  
  options.forEach((item, index) => {
    Logger.logInfo(`${index + 1}. ${displayFn(item)}`);
  });
  
  const answer = await askQuestion('Enter selection number:');
  const index = parseInt(answer, 10) - 1;
  
  if (isNaN(index) || index < 0 || index >= options.length) {
    Logger.logError('Invalid selection');
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
    Logger.logError('Domain is required');
    return askDomain();
  }
  
  // Domain formatını doğrula
  if (!/^[a-z0-9]([a-z0-9-]+)?[a-z0-9]$/.test(domain)) {
    Logger.logError('Invalid domain format. Use lowercase letters, numbers and hyphens only. Cannot start or end with a hyphen.');
    return askDomain();
  }
  
  return domain;
};

// Şema tipi sorgusu
export const askSchemaType = async (): Promise<string> => {
  Logger.logInfo('Select schema type:');
  Logger.logInfo('1. SYS - System schema');
  Logger.logInfo('2. COMMON - Common data schema');
  Logger.logInfo('3. TENANT - Tenant specific schema');
  
  const answer = await askQuestion('Enter selection number:');
  const index = parseInt(answer, 10);
  
  switch (index) {
    case 1: return 'SYS';
    case 2: return 'COMMON'; 
    case 3: return 'TENANT';
    default:
      Logger.logError('Invalid selection');
      return askSchemaType();
  }
};

// Email sorgusu
export const askEmail = async (): Promise<string> => {
  const email = await askQuestion('Enter email address:');
  
  // Email formatını doğrula
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    Logger.logError('Invalid email format');
    return askEmail();
  }
  
  return email;
};

// Tenant türü sorgusu
export const askTenantType = async (): Promise<string> => {
  Logger.logInfo('Select tenant type:');
  Logger.logInfo('1. GYM - Traditional fitness center');
  Logger.logInfo('2. STUDIO - Specialized studio (yoga, pilates, etc.)');
  Logger.logInfo('3. PERSONAL_TRAINER - Independent trainer');
  Logger.logInfo('4. ENTERPRISE - Corporate wellness');
  
  const answer = await askQuestion('Enter selection number:');
  const index = parseInt(answer, 10);
  
  switch (index) {
    case 1: return 'GYM';
    case 2: return 'STUDIO';
    case 3: return 'PERSONAL_TRAINER';
    case 4: return 'ENTERPRISE';
    default:
      Logger.logError('Invalid selection');
      return askTenantType();
  }
}; 