// src/shared/database/seeds/public/index.ts - Updated
import { PublicDataSource } from '../../config/public-connection';
import { logger } from '@/shared/utils/logger.util';
import { seedMultipleTenants } from './multi-tenant-seed';

export async function seedPublicData() {
  try {
    logger.info('🌱 Starting public schema seeding...');

    if (!PublicDataSource.isInitialized) {
      await PublicDataSource.initialize();
    }

    // Seed multiple tenant types
    await seedMultipleTenants();

    logger.info('✅ Public schema seeded successfully');
  } catch (error) {
    logger.error('❌ Failed to seed public schema:', error);
    throw error;
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedPublicData()
    .then(() => {
      logger.info('🎉 Public seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Public seeding failed:', error);
      process.exit(1);
    });
}