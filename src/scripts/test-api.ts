/**
 * NexPhys API'yi test etmek için kullanılan script
 * Temel HTTP isteklerini gerçekleştirir ve sonuçları kontrol eder
 */
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from '@/shared/utils/logger.util';
import { envConfig } from '@/config/env.config';

// Konfigürasyon
const BASE_URL = envConfig.API_URL || `http://localhost:${envConfig.PORT}${envConfig.API_PREFIX}`;
const LOG_REQUESTS = process.env.LOG_REQUESTS === 'true';
let authToken: string | null = null;

// Renk kodları
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Test durumlarını takip etmek için sayaçlar
let testsPassed = 0;
let testsFailed = 0;

// API yanıt tipi
interface ApiResponse<T = any> {
  status: string;
  message: string;
  data: T;
}

/**
 * HTTP isteği göndermek için yardımcı fonksiyon
 */
async function makeRequest<T = any>(
  method: string, 
  endpoint: string, 
  data: any = null, 
  headers: Record<string, string> = {}
): Promise<AxiosResponse<ApiResponse<T>>> {
  // Auth token varsa ekle
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const config: AxiosRequestConfig = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (data && (method.toLowerCase() === 'post' || method.toLowerCase() === 'put' || method.toLowerCase() === 'patch')) {
    config.data = data;
  } else if (data && method.toLowerCase() === 'get') {
    config.params = data;
  }

  if (LOG_REQUESTS) {
    console.log(`${colors.blue}[${method.toUpperCase()}]${colors.reset} ${endpoint}`);
    if (data) {
      console.log(`${colors.blue}Data:${colors.reset}`, JSON.stringify(data, null, 2));
    }
  }

  try {
    const response = await axios(config);
    
    if (LOG_REQUESTS) {
      console.log(`${colors.green}Response (${response.status}):${colors.reset}`, JSON.stringify(response.data, null, 2));
    }
    
    return response;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      if (LOG_REQUESTS) {
        console.log(`${colors.red}Error (${error.response.status}):${colors.reset}`, JSON.stringify(error.response.data, null, 2));
      }
      return error.response;
    }
    throw error;
  }
}

/**
 * Test sonucunu raporla
 */
function reportTestResult(testName: string, passed: boolean, details: string = ''): void {
  if (passed) {
    testsPassed++;
    console.log(`${colors.green}✓ PASS:${colors.reset} ${testName}`);
  } else {
    testsFailed++;
    console.log(`${colors.red}✗ FAIL:${colors.reset} ${testName}`);
  }
  
  if (details) {
    console.log(`  ${details}`);
  }
  
  console.log(''); // Boş satır ekle
}

/**
 * Sağlık kontrolü
 */
async function testHealthCheck(): Promise<boolean> {
  try {
    const response = await makeRequest('get', '/health');
    const passed = response.status === 200;
    
    reportTestResult('Health Check', passed, 
      passed ? 'API is running' : `Expected status 200, got ${response.status}`);
      
    return passed;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    reportTestResult('Health Check', false, `Error: ${errorMessage}`);
    return false;
  }
}

/**
 * Giriş testi
 */
async function testLogin(): Promise<boolean> {
  try {
    const loginData = {
      email: 'testadmin@nexphys.test',
      password: 'Test123!'
    };
    
    const response = await makeRequest('post', '/auth/login', loginData);
    const passed = response.status === 200 && response.data.status === 'success';
    
    if (passed && response.data.data?.token) {
      authToken = response.data.data.token;
    }
    
    reportTestResult('Login', passed, 
      passed ? 'Successfully logged in' : `Login failed: ${response.data.message || response.statusText}`);
      
    return passed;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    reportTestResult('Login', false, `Error: ${errorMessage}`);
    return false;
  }
}

/**
 * Kullanıcı profili testi
 */
async function testGetProfile(): Promise<boolean> {
  try {
    if (!authToken) {
      reportTestResult('Get Profile', false, 'Authentication token missing');
      return false;
    }
    
    const response = await makeRequest('get', '/auth/profile');
    const passed = response.status === 200 && response.data.status === 'success';
    
    reportTestResult('Get Profile', passed, 
      passed ? `Profile retrieved for ${response.data.data?.email}` : 
               `Failed to get profile: ${response.data.message || response.statusText}`);
               
    return passed;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    reportTestResult('Get Profile', false, `Error: ${errorMessage}`);
    return false;
  }
}

/**
 * Tenant listesi testi
 */
async function testListTenants(): Promise<boolean> {
  try {
    if (!authToken) {
      reportTestResult('List Tenants', false, 'Authentication token missing');
      return false;
    }
    
    const response = await makeRequest('get', '/tenants');
    const passed = response.status === 200 && response.data.status === 'success';
    
    reportTestResult('List Tenants', passed, 
      passed ? `Retrieved ${response.data.data?.length || 0} tenants` : 
               `Failed to list tenants: ${response.data.message || response.statusText}`);
               
    return passed;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    reportTestResult('List Tenants', false, `Error: ${errorMessage}`);
    return false;
  }
}

/**
 * Tüm testleri çalıştır
 */
async function runAllTests(): Promise<void> {
  console.log(`${colors.cyan}====================================${colors.reset}`);
  console.log(`${colors.cyan}   NEXPHYS API TEST SUITE          ${colors.reset}`);
  console.log(`${colors.cyan}====================================${colors.reset}`);
  console.log(`${colors.yellow}Target API:${colors.reset} ${BASE_URL}`);
  console.log('');
  
  const startTime = Date.now();
  
  // Sağlık kontrolü
  await testHealthCheck();
  
  // Giriş yap
  const loginSuccess = await testLogin();
  
  // Eğer giriş başarılıysa, diğer testleri çalıştır
  if (loginSuccess) {
    await testGetProfile();
    await testListTenants();
    // Diğer testler buraya eklenebilir
  } else {
    console.log(`${colors.yellow}Skipping authenticated tests due to login failure${colors.reset}`);
  }
  
  // Test sonuçlarını göster
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`${colors.cyan}====================================${colors.reset}`);
  console.log(`${colors.cyan}   TEST RESULTS                    ${colors.reset}`);
  console.log(`${colors.cyan}====================================${colors.reset}`);
  console.log(`Tests: ${testsPassed + testsFailed}`);
  console.log(`${colors.green}Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testsFailed}${colors.reset}`);
  console.log(`Duration: ${duration}s`);
  
  if (testsFailed > 0) {
    process.exit(1);
  }
}

// Testleri çalıştır
runAllTests().catch(error => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`${colors.red}Unhandled error:${colors.reset} ${errorMessage}`);
  process.exit(1);
});
