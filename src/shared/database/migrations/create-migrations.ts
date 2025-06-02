// src/shared/database/migrations/create-migrations.ts
import { PublicDataSource } from '../config/public-connection';
import { createTenantDataSource, getTenantConnection } from '../config/tenant-connection';
import { logger } from '@/shared/utils/logger.util';

async function createPublicTables() {
  try {
    logger.info('🔧 Creating public schema tables...');
    
    if (!PublicDataSource.isInitialized) {
      await PublicDataSource.initialize();
    }

    // Create tenants table
    await PublicDataSource.query(`
      CREATE TABLE IF NOT EXISTS "public"."tenants" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "name" VARCHAR(200) NOT NULL,
        "domain" VARCHAR(100) NOT NULL UNIQUE,
        "schemaName" VARCHAR(63) NOT NULL UNIQUE,
        "tenantType" VARCHAR(50) NOT NULL,
        "status" VARCHAR(50) NOT NULL DEFAULT 'TRIAL',
        "description" TEXT,
        "logo" VARCHAR(255),
        "settings" JSONB,
        "contact" JSONB,
        "trialStartDate" TIMESTAMP WITH TIME ZONE,
        "trialEndDate" TIMESTAMP WITH TIME ZONE,
        "isSchemaCreated" BOOLEAN DEFAULT false,
        "lastAccessAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      );
      
      CREATE INDEX IF NOT EXISTS "IDX_tenants_domain" ON "public"."tenants" ("domain");
      CREATE INDEX IF NOT EXISTS "IDX_tenants_schemaName" ON "public"."tenants" ("schemaName");
    `);
    
    // Create subscriptions table
    await PublicDataSource.query(`
      CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" UUID NOT NULL,
        "plan" VARCHAR(50) NOT NULL,
        "status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        "monthlyPrice" DECIMAL(10,2) NOT NULL,
        "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "endDate" TIMESTAMP WITH TIME ZONE,
        "autoRenew" BOOLEAN DEFAULT true,
        "features" JSONB,
        "billingDetails" JSONB,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscription_tenant" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants" ("id") ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS "IDX_subscriptions_tenantId" ON "public"."subscriptions" ("tenantId");
    `);
    
    // Create users table
    await PublicDataSource.query(`
      CREATE TABLE IF NOT EXISTS "public"."users" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password" VARCHAR(255) NOT NULL,
        "firstName" VARCHAR(100) NOT NULL,
        "lastName" VARCHAR(100) NOT NULL,
        "status" VARCHAR(50) NOT NULL,
        "role" VARCHAR(50) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
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
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
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

async function createTenantTables(schemaName: string) {
  try {
    logger.info(`🔧 Creating tenant tables in schema ${schemaName}...`);
    
    const tenantDataSource = await getTenantConnection(schemaName);
    
    // Create schema if not exists
    await tenantDataSource.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
    
    // Create users table
    await tenantDataSource.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."users" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password" VARCHAR(255) NOT NULL,
        "firstName" VARCHAR(100) NOT NULL,
        "lastName" VARCHAR(100) NOT NULL,
        "status" VARCHAR(50) NOT NULL,
        "role" VARCHAR(50) NOT NULL,
        "phone" VARCHAR(50),
        "profileImage" VARCHAR(255),
        "details" JSONB,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      );
      
      CREATE INDEX IF NOT EXISTS "${schemaName}_IDX_users_email" ON "${schemaName}"."users" ("email");
      CREATE INDEX IF NOT EXISTS "${schemaName}_IDX_users_role" ON "${schemaName}"."users" ("role");
    `);
    
    // Create roleTypes table
    await tenantDataSource.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."roleTypes" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "name" VARCHAR(100) NOT NULL UNIQUE,
        "description" TEXT,
        "permissions" JSONB,
        "isSystem" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      );
      
      CREATE INDEX IF NOT EXISTS "${schemaName}_IDX_roleTypes_name" ON "${schemaName}"."roleTypes" ("name");
    `);
    
    // Create tenant-specific settings table
    await tenantDataSource.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."settings" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "key" VARCHAR(255) NOT NULL UNIQUE,
        "value" JSONB NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      );
      
      CREATE INDEX IF NOT EXISTS "${schemaName}_IDX_settings_key" ON "${schemaName}"."settings" ("key");
    `);
    
    logger.info(`✅ Tenant schema ${schemaName} tables created successfully`);
  } catch (error) {
    logger.error(`❌ Failed to create tables in tenant schema ${schemaName}:`, error);
    throw error;
  }
}

export async function createAllTables() {
  try {
    // First create public schema tables
    await createPublicTables();
    
    // Then get all existing tenant schemas and create their tables
    if (!PublicDataSource.isInitialized) {
      await PublicDataSource.initialize();
    }
    
    try {
      // Try to get tenants with is_schema_created=false
      // First check if the column exists
      const columnExists = await PublicDataSource.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'is_schema_created'
      `);
      
      let tenants = [];
      
      if (columnExists && columnExists.length > 0) {
        // If column exists, query using it
        tenants = await PublicDataSource.query(`
          SELECT schema_name FROM public.tenants WHERE is_schema_created = false
        `);
      } else {
        // If column doesn't exist yet, get all tenants
        tenants = await PublicDataSource.query(`
          SELECT schema_name FROM public.tenants
        `);
        
        // If no tenants found but the table exists, it's probably a new installation
        // We'll check if the table has records
        if (!tenants || tenants.length === 0) {
          const tenantCount = await PublicDataSource.query(`
            SELECT COUNT(*) FROM public.tenants
          `);
          
          if (tenantCount && tenantCount[0] && parseInt(tenantCount[0].count) === 0) {
            logger.info('✅ No tenants found. Table exists but is empty.');
          }
        }
      }
      
      if (tenants && tenants.length > 0) {
        for (const tenant of tenants) {
          await createTenantTables(tenant.schema_name);
          
          // Try to update the is_schema_created field if it exists
          if (columnExists && columnExists.length > 0) {
            await PublicDataSource.query(`
              UPDATE public.tenants SET is_schema_created = true 
              WHERE schema_name = '${tenant.schema_name}'
            `);
          }
        }
      }
    } catch (error) {
      logger.warn('⚠️ No tenants found or tenants table not created yet:', error);
    }
    
    logger.info('✅ All database tables created successfully');
  } catch (error) {
    logger.error('❌ Failed to create database tables:', error);
    throw error;
  } finally {
    // Close connections
    if (PublicDataSource.isInitialized) {
      await PublicDataSource.destroy();
    }
    // Tenant connections are managed by the getTenantConnection system
  }
}

// Run creation if called directly
if (require.main === module) {
  createAllTables()
    .then(() => {
      logger.info('🎉 Database tables creation completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Database tables creation failed:', error);
      process.exit(1);
    });
}
