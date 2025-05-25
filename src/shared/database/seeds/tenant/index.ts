// src/shared/database/seeds/tenant/index.ts - Updated
import { PublicDataSource } from '../../config/public-connection';
import { Tenant } from '../../entities/public/tenant.entity';
import { seedTenantSpecificData } from './tenant-type-specific-seed';
import { logger } from '@/shared/utils/logger.util';

export async function seedAllTenantSchemas() {
  try {
    logger.info('🌱 Starting tenant schemas seeding...');

    if (!PublicDataSource.isInitialized) {
      await PublicDataSource.initialize();
    }

    // Get all tenants
    const tenantRepository = PublicDataSource.getRepository(Tenant);
    const tenants = await tenantRepository.find();

    if (tenants.length === 0) {
      logger.warn('⚠️  No tenants found. Run public schema seeding first.');
      return;
    }

    // Seed each tenant schema with their specific data
    for (const tenant of tenants) {
      logger.info(`🏢 Seeding tenant: ${tenant.name} (${tenant.tenantType})`);

      try {
        await seedTenantSpecificData(tenant.tenantType, tenant.schemaName);

        // Mark schema as created
        tenant.isSchemaCreated = true;
        await tenantRepository.save(tenant);

      } catch (error) {
        logger.error(`❌ Failed to seed tenant ${tenant.name}:`, error);
        // Continue with other tenants
      }
    }

    logger.info('✅ All tenant schemas seeded successfully');
  } catch (error) {
    logger.error('❌ Failed to seed tenant schemas:', error);
    throw error;
  }
}

// Seed specific tenant by domain
export async function seedSpecificTenant(domain: string) {
  try {
    logger.info(`🏢 Seeding specific tenant: ${domain}`);

    if (!PublicDataSource.isInitialized) {
      await PublicDataSource.initialize();
    }

    const tenantRepository = PublicDataSource.getRepository(Tenant);
    const tenant = await tenantRepository.findOne({ where: { domain } });

    if (!tenant) {
      throw new Error(`Tenant not found: ${domain}`);
    }

    await seedTenantSpecificData(tenant.tenantType, tenant.schemaName);

    tenant.isSchemaCreated = true;
    await tenantRepository.save(tenant);

    logger.info(`✅ Tenant ${tenant.name} seeded successfully`);
  } catch (error) {
    logger.error(`❌ Failed to seed tenant ${domain}:`, error);
    throw error;
  }
}

// Run seeding if called directly
if (require.main === module) {
  const tenantDomain = process.argv[2];

  if (tenantDomain) {
    // Seed specific tenant
    seedSpecificTenant(tenantDomain)
      .then(() => {
        logger.info(`🎉 Tenant ${tenantDomain} seeding completed`);
        process.exit(0);
      })
      .catch((error) => {
        logger.error(`💥 Tenant ${tenantDomain} seeding failed:`, error);
        process.exit(1);
      });
  } else {
    // Seed all tenants
    seedAllTenantSchemas()
      .then(() => {
        logger.info('🎉 All tenant seeding completed');
        process.exit(0);
      })
      .catch((error) => {
        logger.error('💥 Tenant seeding failed:', error);
        process.exit(1);
      });
  }
}