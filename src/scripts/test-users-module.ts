/**
 * NexPhys User Module Test Scripti
 * 
 * Bu script, kullanıcı modülünü ve ilgili API'leri test etmek için kullanılır.
 * Kullanıcı oluşturma, güncelleme, silme ve listeleme gibi temel işlemleri test eder.
 */

import axios from 'axios';
import { logger } from '@/shared/utils/logger.util';
import { envConfig } from '@/config/env.config';

// Konfigürasyon
const API_URL = `http://localhost:${envConfig.PORT}${envConfig.API_PREFIX}`;
const AUTH_HEADER = { Authorization: '' };
let userId: string;

/**
 * Test kullanıcısı oluştur
 */
async function createTestUser() {
  try {
    const randomNum = Math.floor(Math.random() * 10000);
    const userData = {
      firstName: `Test${randomNum}`,
      lastName: 'User',
      email: `testuser${randomNum}@nexphys.test`,
      password: 'Test123!',
      roleId: '1', // Admin rol ID
    };

    logger.info(`📝 Creating test user: ${userData.email}`);
    const response = await axios.post(`${API_URL}/users`, userData, { headers: AUTH_HEADER });

    if (response.status === 201) {
      userId = response.data.data.id;
      logger.info(`✅ Test user created with ID: ${userId}`);
      return true;
    } else {
      logger.error(`❌ Failed to create test user: ${response.statusText}`);
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Error creating test user: ${errorMessage}`);
    return false;
  }
}

/**
 * Kullanıcıyı güncelle
 */
async function updateTestUser() {
  try {
    const updateData = {
      firstName: 'UpdatedName',
    };

    logger.info(`📝 Updating test user ${userId}`);
    const response = await axios.patch(`${API_URL}/users/${userId}`, updateData, { headers: AUTH_HEADER });

    if (response.status === 200) {
      logger.info(`✅ Test user updated successfully`);
      return true;
    } else {
      logger.error(`❌ Failed to update test user: ${response.statusText}`);
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Error updating test user: ${errorMessage}`);
    return false;
  }
}

/**
 * Kullanıcıyı getir
 */
async function getTestUser() {
  try {
    logger.info(`📝 Getting test user ${userId}`);
    const response = await axios.get(`${API_URL}/users/${userId}`, { headers: AUTH_HEADER });

    if (response.status === 200) {
      logger.info(`✅ Test user retrieved successfully`);
      logger.info(`User details: ${JSON.stringify(response.data.data, null, 2)}`);
      return true;
    } else {
      logger.error(`❌ Failed to get test user: ${response.statusText}`);
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Error getting test user: ${errorMessage}`);
    return false;
  }
}

/**
 * Kullanıcı listesini getir
 */
async function listUsers() {
  try {
    logger.info(`📝 Listing users`);
    const response = await axios.get(`${API_URL}/users`, { headers: AUTH_HEADER });

    if (response.status === 200) {
      const users = response.data.data;
      logger.info(`✅ Retrieved ${users.length} users`);
      return true;
    } else {
      logger.error(`❌ Failed to list users: ${response.statusText}`);
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Error listing users: ${errorMessage}`);
    return false;
  }
}

/**
 * Kullanıcıyı sil
 */
async function deleteTestUser() {
  try {
    logger.info(`📝 Deleting test user ${userId}`);
    const response = await axios.delete(`${API_URL}/users/${userId}`, { headers: AUTH_HEADER });

    if (response.status === 200) {
      logger.info(`✅ Test user deleted successfully`);
      return true;
    } else {
      logger.error(`❌ Failed to delete test user: ${response.statusText}`);
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Error deleting test user: ${errorMessage}`);
    return false;
  }
}

/**
 * Admin hesabı ile giriş yap
 */
async function login() {
  try {
    const loginData = {
      email: 'admin@nexphys.com',
      password: 'Admin123!',
    };

    logger.info(`📝 Logging in as ${loginData.email}`);
    const response = await axios.post(`${API_URL}/auth/login`, loginData);

    if (response.status === 200 && response.data.status === 'success') {
      const token = response.data.data.token;
      AUTH_HEADER.Authorization = `Bearer ${token}`;
      logger.info(`✅ Login successful`);
      return true;
    } else {
      logger.error(`❌ Login failed: ${response.statusText}`);
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Error during login: ${errorMessage}`);
    return false;
  }
}

/**
 * Tüm testleri çalıştır
 */
async function runAllTests() {
  logger.info('🚀 Starting NexPhys User Module Tests');
  logger.info('===================================');

  // Giriş yap
  if (!(await login())) {
    logger.error('❌ Login failed, stopping tests');
    return;
  }

  // Kullanıcı oluştur
  if (!(await createTestUser())) {
    logger.error('❌ User creation failed, stopping tests');
    return;
  }

  // Kullanıcıları listele
  await listUsers();

  // Kullanıcı bilgilerini getir
  await getTestUser();

  // Kullanıcıyı güncelle
  await updateTestUser();

  // Güncellenmiş kullanıcı bilgilerini getir
  await getTestUser();

  // Temizlik: Kullanıcıyı sil
  await deleteTestUser();

  logger.info('✅ All tests completed');
}

// Tüm testleri çalıştır
runAllTests().catch((error) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error(`Unhandled error: ${errorMessage}`);
  process.exit(1);
});
