// src/scripts/setup-nexphys-environment.ts
import { PublicDataSource } from '../shared/database/config/public-connection';
import { logger } from '../shared/utils/logger.util';
import * as bcrypt from 'bcrypt';

// Tenant Configuration (Based on Nexphys.com)
const TENANT_TYPES = {
  GYM: 'GYM',
  STUDIO: 'STUDIO',
  PERSONAL_TRAINER: 'PERSONAL_TRAINER',
  ENTERPRISE: 'ENTERPRISE'
};

const TENANTS = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'FitMax Gym',
    domain: 'fitmax-gym.nexphys.com',
    schemaName: 'tenant_fitmax_gym',
    tenantType: TENANT_TYPES.GYM,
    description: 'Traditional fitness center with equipment and group classes',
    contact: {
      email: 'info@fitmax-gym.nexphys.com',
      phone: '+1-555-0101',
      address: {
        street: '123 Fitness St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US'
      }
    }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Zen Yoga Studio',
    domain: 'zen-yoga.nexphys.com',
    schemaName: 'tenant_zen_yoga',
    tenantType: TENANT_TYPES.STUDIO,
    description: 'Peaceful yoga studio offering various yoga styles and meditation',
    contact: {
      email: 'info@zen-yoga.nexphys.com',
      phone: '+1-555-0202',
      address: {
        street: '456 Zen Ave',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'US'
      }
    }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Elite Personal Training',
    domain: 'elite-pt.nexphys.com',
    schemaName: 'tenant_elite_pt',
    tenantType: TENANT_TYPES.PERSONAL_TRAINER,
    description: 'Premium personal training services for individual fitness goals',
    contact: {
      email: 'info@elite-pt.nexphys.com',
      phone: '+1-555-0303',
      address: {
        street: '789 Coach Blvd',
        city: 'Miami',
        state: 'FL',
        postalCode: '33101',
        country: 'US'
      }
    }
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'TechCorp Wellness',
    domain: 'techcorp-wellness.nexphys.com',
    schemaName: 'tenant_techcorp_wellness',
    tenantType: TENANT_TYPES.ENTERPRISE,
    description: 'Corporate wellness program for technology companies',
    contact: {
      email: 'wellness@techcorp.nexphys.com',
      phone: '+1-555-0404',
      address: {
        street: '1010 Tech Park',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'US'
      }
    }
  }
];

/**
 * Create public schema tables 
 */
async function createPublicSchemaTables() {
  try {
    logger.info('🔧 Creating public schema tables...');
    
    // Create extension for UUID generation if not exists
    await PublicDataSource.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    
    // Create tenants table
    await PublicDataSource.query(`
      CREATE TABLE IF NOT EXISTS "public"."tenants" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "name" VARCHAR(200) NOT NULL,
        "domain" VARCHAR(100) NOT NULL UNIQUE,
        "schema_name" VARCHAR(63) NOT NULL UNIQUE,
        "tenant_type" VARCHAR(50) NOT NULL,
        "status" VARCHAR(50) NOT NULL DEFAULT 'TRIAL',
        "description" TEXT,
        "logo" VARCHAR(255),
        "settings" JSONB,
        "contact" JSONB,
        "trial_start_date" TIMESTAMP WITH TIME ZONE,
        "trial_end_date" TIMESTAMP WITH TIME ZONE,
        "is_schema_created" BOOLEAN DEFAULT false,
        "last_access_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      );
      
      CREATE INDEX IF NOT EXISTS "IDX_tenants_domain" ON "public"."tenants" ("domain");
      CREATE INDEX IF NOT EXISTS "IDX_tenants_schema_name" ON "public"."tenants" ("schema_name");
    `);
    
    // Create subscriptions table
    await PublicDataSource.query(`
      CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" UUID NOT NULL,
        "plan" VARCHAR(50) NOT NULL,
        "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        "monthly_price" DECIMAL(10,2) NOT NULL,
        "start_date" TIMESTAMP WITH TIME ZONE NOT NULL,
        "end_date" TIMESTAMP WITH TIME ZONE,
        "auto_renew" BOOLEAN DEFAULT true,
        "features" JSONB,
        "billing_details" JSONB,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscription_tenant" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants" ("id") ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS "IDX_subscriptions_tenant_id" ON "public"."subscriptions" ("tenant_id");
    `);
    
    // Create users table
    await PublicDataSource.query(`
      CREATE TABLE IF NOT EXISTS "public"."users" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password" VARCHAR(255) NOT NULL,
        "first_name" VARCHAR(100) NOT NULL,
        "last_name" VARCHAR(100) NOT NULL,
        "status" VARCHAR(50) NOT NULL,
        "role" VARCHAR(50) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      );
      
      CREATE INDEX IF NOT EXISTS "IDX_users_email" ON "public"."users" ("email");
    `);
    
    // Create settings table
    await PublicDataSource.query(`
      CREATE TABLE IF NOT EXISTS "public"."settings" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "key" VARCHAR(255) NOT NULL UNIQUE,
        "value" JSONB NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      );
      
      CREATE INDEX IF NOT EXISTS "IDX_settings_key" ON "public"."settings" ("key");
    `);
    
    logger.info('✅ Public schema tables created successfully');
  } catch (error) {
    logger.error('❌ Failed to create public schema tables:', error);
    throw error;
  }
}

/**
 * Create tenant tables for a specific schema
 */
async function createTenantSchemaTables(schemaName: string) {
  try {
    logger.info(`🔧 Creating tables for tenant schema ${schemaName}...`);
    
    // Create schema if not exists
    await PublicDataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    
    // Create users table
    await PublicDataSource.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."users" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password" VARCHAR(255) NOT NULL,
        "first_name" VARCHAR(100) NOT NULL,
        "last_name" VARCHAR(100) NOT NULL,
        "status" VARCHAR(50) NOT NULL,
        "role" VARCHAR(50) NOT NULL,
        "phone" VARCHAR(50),
        "profile_image" VARCHAR(255),
        "details" JSONB,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      );
      
      CREATE INDEX IF NOT EXISTS "${schemaName}_IDX_users_email" ON "${schemaName}"."users" ("email");
      CREATE INDEX IF NOT EXISTS "${schemaName}_IDX_users_role" ON "${schemaName}"."users" ("role");
    `);
    
    // Create role_types table
    await PublicDataSource.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."role_types" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "name" VARCHAR(100) NOT NULL,
        "code" VARCHAR(50) NOT NULL UNIQUE,
        "description" TEXT,
        "level" VARCHAR(50) NOT NULL,
        "category" VARCHAR(50) NOT NULL,
        "permissions" JSONB,
        "is_system" BOOLEAN DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      );
      
      CREATE INDEX IF NOT EXISTS "${schemaName}_IDX_role_types_code" ON "${schemaName}"."role_types" ("code");
    `);
    
    // Create tenant-specific settings table
    await PublicDataSource.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."settings" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "key" VARCHAR(255) NOT NULL UNIQUE,
        "value" JSONB NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      );
      
      CREATE INDEX IF NOT EXISTS "${schemaName}_IDX_settings_key" ON "${schemaName}"."settings" ("key");
    `);
    
    logger.info(`✅ Tenant schema ${schemaName} tables created successfully`);
    
    // Update tenant record to mark schema as created
    await PublicDataSource.query(`
      UPDATE public.tenants SET is_schema_created = true 
      WHERE schema_name = '${schemaName}'
    `);
  } catch (error) {
    logger.error(`❌ Failed to create tables in tenant schema ${schemaName}:`, error);
    throw error;
  }
}

/**
 * Seed default admin users
 */
async function seedAdminUsers() {
  try {
    logger.info('🌱 Seeding admin users...');
    
    // Create hashed password for admin users
    const adminPassword = await bcrypt.hash('superadmin123', 10); 
    const tenantAdminPassword = await bcrypt.hash('admin123', 10);
    
    // Insert superadmin user
    await PublicDataSource.query(`
      INSERT INTO "public"."users" (
        "id", "email", "password", "first_name", "last_name", "status", "role", "created_at", "updated_at"
      ) VALUES (
        '550e8400-e29b-41d4-a716-446655440900', 'superadmin@nexphys.com', '${adminPassword}', 'Super', 'Admin', 'ACTIVE', 'SUPERADMIN',
        NOW(), NOW()
      ) ON CONFLICT ("email") DO NOTHING;
    `);
    
    // Insert tenant admin user
    await PublicDataSource.query(`
      INSERT INTO "public"."users" (
        "id", "email", "password", "first_name", "last_name", "status", "role", "created_at", "updated_at"
      ) VALUES (
        '550e8400-e29b-41d4-a716-446655440901', 'admin@nexphys.com', '${tenantAdminPassword}', 'Tenant', 'Admin', 'ACTIVE', 'ADMIN',
        NOW(), NOW()
      ) ON CONFLICT ("email") DO NOTHING;
    `);
    
    // Create domain verification setting
    await PublicDataSource.query(`
      INSERT INTO "public"."settings" (
        "id", "key", "value", "created_at", "updated_at"
      ) VALUES (
        '550e8400-e29b-41d4-a716-446655440902', 'domain_verification', '{"enabled": true, "method": "DNS_TXT", "ttl": 3600}',
        NOW(), NOW()
      ) ON CONFLICT ("key") DO NOTHING;
    `);
    
    logger.info('✅ Admin users seeded successfully');
  } catch (error) {
    logger.error('❌ Failed to seed admin users:', error);
    throw error;
  }
}

/**
 * Create and seed tenant records
 */
async function createAndSeedTenants() {
  try {
    logger.info('🌱 Creating and seeding tenant records...');
    
    for (const tenant of TENANTS) {
      // Insert tenant record
      await PublicDataSource.query(`
        INSERT INTO "public"."tenants" (
          "id", "name", "domain", "schemaName", "tenantType", "description", "contact", "createdAt", "updatedAt"
        ) VALUES (
          '${tenant.id}', '${tenant.name}', '${tenant.domain}', '${tenant.schemaName}', '${tenant.tenantType}', 
          '${tenant.description}', '${JSON.stringify(tenant.contact)}', NOW(), NOW()
        ) ON CONFLICT ("domain") DO NOTHING;
      `);
      
      // Create subscription record for tenant
      await PublicDataSource.query(`
        INSERT INTO "public"."subscriptions" (
          "id", "tenantId", "plan", "status", "monthlyPrice", "startDate", "createdAt", "updatedAt"
        ) VALUES (
          uuid_generate_v4(), '${tenant.id}', 'PREMIUM', 'ACTIVE', 99.99, NOW(), NOW(), NOW()
        ) ON CONFLICT DO NOTHING;
      `);
      
      // Create tenant schema and tables
      await createTenantSchemaTables(tenant.schemaName);
      
      // Seed role types for tenant
      await seedRoleTypesForTenant(tenant.schemaName, tenant.tenantType);
      
      // Seed users for tenant
      await seedUsersForTenant(tenant.schemaName, tenant.tenantType, tenant.domain);
      
      logger.info(`✅ Tenant ${tenant.name} created and seeded successfully`);
    }
    
    logger.info('✅ All tenants created and seeded successfully');
  } catch (error) {
    logger.error('❌ Failed to create and seed tenants:', error);
    throw error;
  }
}

/**
 * Seed role types for a tenant based on tenant type
 */
async function seedRoleTypesForTenant(schemaName: string, tenantType: string) {
  try {
    logger.info(`🌱 Seeding role types for ${tenantType} tenant: ${schemaName}...`);
    
    // Insert common role types
    await PublicDataSource.query(`
      INSERT INTO "${schemaName}"."role_types" (
        "id", "name", "code", "description", "level", "category", "is_system", "created_at", "updated_at"
      ) VALUES (
        uuid_generate_v4(), 'System Administrator', 'SYSTEM_ADMIN', 'Full system administrator with all permissions',
        'ADMIN', 'SYSTEM', true, NOW(), NOW()
      ) ON CONFLICT ("code") DO NOTHING;
    `);
    
    // Insert tenant-type-specific roles
    switch (tenantType) {
      case TENANT_TYPES.GYM:
        // GYM specific roles
        await PublicDataSource.query(`
          INSERT INTO "${schemaName}"."role_types" (
            "id", "name", "code", "description", "level", "category", "is_system", "created_at", "updated_at"
          ) VALUES 
          (uuid_generate_v4(), 'Gym Owner', 'GYM_OWNER', 'Owner with full gym management access', 'ADMIN', 'BUSINESS', true, NOW(), NOW()),
          (uuid_generate_v4(), 'Gym Manager', 'GYM_MANAGER', 'Manager with operational permissions', 'STAFF', 'BUSINESS', true, NOW(), NOW()),
          (uuid_generate_v4(), 'Gym Coach', 'GYM_COACH', 'Fitness coach with training permissions', 'STAFF', 'TRAINING', true, NOW(), NOW()),
          (uuid_generate_v4(), 'Gym Member', 'GYM_MEMBER', 'Regular gym member', 'MEMBER', 'CLIENT', true, NOW(), NOW())
          ON CONFLICT ("code") DO NOTHING;
        `);
        break;
        
      case TENANT_TYPES.STUDIO:
        // STUDIO specific roles
        await PublicDataSource.query(`
          INSERT INTO "${schemaName}"."role_types" (
            "id", "name", "code", "description", "level", "category", "is_system", "created_at", "updated_at"
          ) VALUES 
          (uuid_generate_v4(), 'Studio Owner', 'STUDIO_OWNER', 'Owner with full studio management access', 'ADMIN', 'BUSINESS', true, NOW(), NOW()),
          (uuid_generate_v4(), 'Studio Manager', 'STUDIO_MANAGER', 'Manager with operational permissions', 'STAFF', 'BUSINESS', true, NOW(), NOW()),
          (uuid_generate_v4(), 'Studio Instructor', 'STUDIO_INSTRUCTOR', 'Class instructor with teaching permissions', 'STAFF', 'INSTRUCTION', true, NOW(), NOW()),
          (uuid_generate_v4(), 'Studio Member', 'STUDIO_MEMBER', 'Regular studio member', 'MEMBER', 'CLIENT', true, NOW(), NOW())
          ON CONFLICT ("code") DO NOTHING;
        `);
        break;
        
      case TENANT_TYPES.PERSONAL_TRAINER:
        // PERSONAL_TRAINER specific roles
        await PublicDataSource.query(`
          INSERT INTO "${schemaName}"."role_types" (
            "id", "name", "code", "description", "level", "category", "is_system", "created_at", "updated_at"
          ) VALUES 
          (uuid_generate_v4(), 'Coach', 'COACH', 'Personal trainer with full client management', 'ADMIN', 'TRAINING', true, NOW(), NOW()),
          (uuid_generate_v4(), 'Client', 'CLIENT', 'Personal training client', 'MEMBER', 'CLIENT', true, NOW(), NOW())
          ON CONFLICT ("code") DO NOTHING;
        `);
        break;
        
      case TENANT_TYPES.ENTERPRISE:
        // ENTERPRISE specific roles
        await PublicDataSource.query(`
          INSERT INTO "${schemaName}"."role_types" (
            "id", "name", "code", "description", "level", "category", "is_system", "created_at", "updated_at"
          ) VALUES 
          (uuid_generate_v4(), 'Wellness Admin', 'WELLNESS_ADMIN', 'Corporate wellness administrator', 'ADMIN', 'BUSINESS', true, NOW(), NOW()),
          (uuid_generate_v4(), 'Wellness Coach', 'WELLNESS_COACH', 'Corporate wellness coach', 'STAFF', 'TRAINING', true, NOW(), NOW()),
          (uuid_generate_v4(), 'Employee', 'EMPLOYEE', 'Corporate employee', 'MEMBER', 'CLIENT', true, NOW(), NOW())
          ON CONFLICT ("code") DO NOTHING;
        `);
        break;
    }
    
    logger.info(`✅ Role types seeded for ${tenantType} tenant: ${schemaName}`);
  } catch (error) {
    logger.error(`❌ Failed to seed role types for tenant ${schemaName}:`, error);
    throw error;
  }
}

/**
 * Seed users for a tenant based on tenant type
 */
async function seedUsersForTenant(schemaName: string, tenantType: string, domain: string) {
  try {
    logger.info(`🌱 Seeding users for ${tenantType} tenant: ${schemaName}...`);
    
    // Create hashed password for tenant users
    const passwordHash = await bcrypt.hash('password123', 10);
    
    // The domain without the .nexphys.com part for email addresses
    const domainPrefix = domain.split('.nexphys.com')[0];
    
    // Insert tenant-type-specific users
    switch (tenantType) {
      case TENANT_TYPES.GYM:
        // GYM specific users
        await PublicDataSource.query(`
          INSERT INTO "${schemaName}"."users" (
            "id", "email", "password", "first_name", "last_name", "status", "role", "created_at", "updated_at"
          ) VALUES 
          (uuid_generate_v4(), 'owner@${domainPrefix}', '${passwordHash}', 'Gym', 'Owner', 'ACTIVE', 'GYM_OWNER', NOW(), NOW()),
          (uuid_generate_v4(), 'manager@${domainPrefix}', '${passwordHash}', 'Gym', 'Manager', 'ACTIVE', 'GYM_MANAGER', NOW(), NOW()),
          (uuid_generate_v4(), 'coach@${domainPrefix}', '${passwordHash}', 'Gym', 'Coach', 'ACTIVE', 'GYM_COACH', NOW(), NOW()),
          (uuid_generate_v4(), 'member@${domainPrefix}', '${passwordHash}', 'Gym', 'Member', 'ACTIVE', 'GYM_MEMBER', NOW(), NOW())
          ON CONFLICT ("email") DO NOTHING;
        `);
        break;
        
      case TENANT_TYPES.STUDIO:
        // STUDIO specific users
        await PublicDataSource.query(`
          INSERT INTO "${schemaName}"."users" (
            "id", "email", "password", "first_name", "last_name", "status", "role", "created_at", "updated_at"
          ) VALUES 
          (uuid_generate_v4(), 'owner@${domainPrefix}', '${passwordHash}', 'Studio', 'Owner', 'ACTIVE', 'STUDIO_OWNER', NOW(), NOW()),
          (uuid_generate_v4(), 'manager@${domainPrefix}', '${passwordHash}', 'Studio', 'Manager', 'ACTIVE', 'STUDIO_MANAGER', NOW(), NOW()),
          (uuid_generate_v4(), 'instructor@${domainPrefix}', '${passwordHash}', 'Studio', 'Instructor', 'ACTIVE', 'STUDIO_INSTRUCTOR', NOW(), NOW()),
          (uuid_generate_v4(), 'student@${domainPrefix}', '${passwordHash}', 'Studio', 'Student', 'ACTIVE', 'STUDIO_MEMBER', NOW(), NOW())
          ON CONFLICT ("email") DO NOTHING;
        `);
        break;
        
      case TENANT_TYPES.PERSONAL_TRAINER:
        // PERSONAL_TRAINER specific users
        await PublicDataSource.query(`
          INSERT INTO "${schemaName}"."users" (
            "id", "email", "password", "first_name", "last_name", "status", "role", "created_at", "updated_at"
          ) VALUES 
          (uuid_generate_v4(), 'coach@${domainPrefix}', '${passwordHash}', 'Personal', 'Trainer', 'ACTIVE', 'COACH', NOW(), NOW()),
          (uuid_generate_v4(), 'client@${domainPrefix}', '${passwordHash}', 'Training', 'Client', 'ACTIVE', 'CLIENT', NOW(), NOW())
          ON CONFLICT ("email") DO NOTHING;
        `);
        break;
        
      case TENANT_TYPES.ENTERPRISE:
        // ENTERPRISE specific users
        await PublicDataSource.query(`
          INSERT INTO "${schemaName}"."users" (
            "id", "email", "password", "first_name", "last_name", "status", "role", "created_at", "updated_at"
          ) VALUES 
          (uuid_generate_v4(), 'wellness@${domainPrefix}', '${passwordHash}', 'Wellness', 'Admin', 'ACTIVE', 'WELLNESS_ADMIN', NOW(), NOW()),
          (uuid_generate_v4(), 'coach@${domainPrefix}', '${passwordHash}', 'Wellness', 'Coach', 'ACTIVE', 'WELLNESS_COACH', NOW(), NOW()),
          (uuid_generate_v4(), 'employee@${domainPrefix}', '${passwordHash}', 'Corporate', 'Employee', 'ACTIVE', 'EMPLOYEE', NOW(), NOW())
          ON CONFLICT ("email") DO NOTHING;
        `);
        break;
    }
    
    logger.info(`✅ Users seeded for ${tenantType} tenant: ${schemaName}`);
  } catch (error) {
    logger.error(`❌ Failed to seed users for tenant ${schemaName}:`, error);
    throw error;
  }
}

/**
 * Main function to set up the entire Nexphys environment
 */
async function setupNexphysEnvironment() {
  try {
    logger.info('🚀 Starting Nexphys environment setup...');
    
    // Initialize data source
    if (!PublicDataSource.isInitialized) {
      await PublicDataSource.initialize();
      logger.info('✅ Public data source initialized');
    }
    
    // Create all public schema tables
    await createPublicSchemaTables();
    
    // Seed admin users
    await seedAdminUsers();
    
    // Create and seed tenants
    await createAndSeedTenants();
    
    logger.info('🎉 Nexphys environment setup completed successfully!');
    
    // Display available tenants and users
    logger.info(`
🏢 Available Nexphys.com Tenants:
  • FitMax Gym (GYM): fitmax-gym.nexphys.com
  • Zen Yoga Studio (STUDIO): zen-yoga.nexphys.com
  • Elite Personal Training (PERSONAL_TRAINER): elite-pt.nexphys.com
  • TechCorp Wellness (ENTERPRISE): techcorp-wellness.nexphys.com

👤 Available Roles and Users:
  • Superadmin: superadmin@nexphys.com / superadmin123
  • Tenant Admin: admin@nexphys.com / admin123
  • GYM: owner@fitmax-gym / password123, manager@fitmax-gym / password123, coach@fitmax-gym / password123, member@fitmax-gym / password123
  • STUDIO: owner@zen-yoga / password123, manager@zen-yoga / password123, instructor@zen-yoga / password123, student@zen-yoga / password123
  • PT: coach@elite-pt / password123, client@elite-pt / password123
  • ENTERPRISE: wellness@techcorp-wellness / password123, coach@techcorp-wellness / password123, employee@techcorp-wellness / password123
    `);
    
  } catch (error) {
    logger.error('💥 Nexphys environment setup failed:', error);
    throw error;
  } finally {
    // Close the data source
    if (PublicDataSource.isInitialized) {
      await PublicDataSource.destroy();
      logger.info('✅ Public data source connection closed');
    }
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupNexphysEnvironment()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}
