import { PublicDataSource } from '../shared/database/config/public-connection';

async function seedTenantsManually() {
  try {
    console.log('Initializing public data source...');
    await PublicDataSource.initialize();
    console.log('Public data source initialized successfully!');
    
    // Create users table if not exists
    console.log('Creating users table...');
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
      )
    `);
    
    // Create settings table if not exists
    console.log('Creating settings table...');
    await PublicDataSource.query(`
      CREATE TABLE IF NOT EXISTS "public"."settings" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "key" VARCHAR(255) NOT NULL UNIQUE,
        "value" JSONB NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      )
    `);
    
    // Create tenants table if not exists
    console.log('Creating tenants table...');
    await PublicDataSource.query(`
      CREATE TABLE IF NOT EXISTS "public"."tenants" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "name" VARCHAR(200) NOT NULL,
        "domain" VARCHAR(100) NOT NULL UNIQUE,
        "schema_name" VARCHAR(63) NOT NULL UNIQUE,
        "tenantType" VARCHAR(50) NOT NULL DEFAULT 'GYM',
        "status" VARCHAR(50) NOT NULL DEFAULT 'TRIAL',
        "description" TEXT,
        "logo" VARCHAR,
        "settings" JSONB,
        "contact" JSONB,
        "trialStartDate" TIMESTAMP,
        "trialEndDate" TIMESTAMP,
        "isSchemaCreated" BOOLEAN NOT NULL DEFAULT false,
        "lastAccessAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        PRIMARY KEY ("id")
      )
    `);
    
    // Create superadmin user
    console.log('Creating superadmin user...');
    const hashedPassword = '$2b$10$WR56DzSPLA6HVMm.4zU0vu824hWPlVAnstB93sAnH3p2CDf8TocIO'; // 'Test123!'
    await PublicDataSource.query(`
      INSERT INTO "public"."users" (
        "id", "email", "password", "first_name", "last_name", "status", "role", "created_at", "updated_at"
      ) VALUES (
        '550e8400-e29b-41d4-a716-446655440999', 'superadmin@nexphys.com', '${hashedPassword}', 'Super', 'Admin', 'ACTIVE', 'SUPERADMIN',
        NOW(), NOW()
      ) ON CONFLICT ("email") DO NOTHING;
    `);
    
    // Create domain verification setting
    console.log('Creating domain verification setting...');
    await PublicDataSource.query(`
      INSERT INTO "public"."settings" (
        "id", "key", "value", "created_at", "updated_at"
      ) VALUES (
        '550e8400-e29b-41d4-a716-446655440900', 'domain_verification', '{"enabled": true, "method": "DNS_TXT", "ttl": 3600}',
        NOW(), NOW()
      ) ON CONFLICT ("key") DO NOTHING;
    `);
    
    // Create tenants with reference to what we know from memories
    console.log('Creating tenant records...');
    
    // Define tenants based on memory
    const tenants = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'FitMax Gym',
        domain: 'fitmax-gym.nexphys.com',
        schema_name: 'tenant_fitmax_gym',
        tenantType: 'GYM'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Zen Yoga Studio',
        domain: 'zen-yoga.nexphys.com',
        schema_name: 'tenant_zen_yoga',
        tenantType: 'STUDIO'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'Elite Personal Training',
        domain: 'elite-pt.nexphys.com',
        schema_name: 'tenant_elite_pt',
        tenantType: 'PERSONAL_TRAINER'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        name: 'TechCorp Wellness',
        domain: 'techcorp-wellness.nexphys.com',
        schema_name: 'tenant_techcorp_wellness',
        tenantType: 'ENTERPRISE'
      }
    ];
    
    // Insert each tenant
    for (const tenant of tenants) {
      console.log(`Creating tenant: ${tenant.name}`);
      const trialEndDate = new Date();
      trialEndDate.setFullYear(trialEndDate.getFullYear() + 1);
      
      await PublicDataSource.query(`
        INSERT INTO "public"."tenants" (
          "id", "name", "domain", "schema_name", "tenantType", "status", "trialStartDate", "trialEndDate", 
          "isSchemaCreated", "createdAt", "updatedAt"
        ) VALUES (
          '${tenant.id}', '${tenant.name}', '${tenant.domain}', '${tenant.schema_name}', 
          '${tenant.tenantType}', 'TRIAL', NOW(), '${trialEndDate.toISOString()}', 
          false, NOW(), NOW()
        ) ON CONFLICT ("domain") DO NOTHING;
      `);
      
      // Create schema for tenant
      console.log(`Creating schema: ${tenant.schema_name}`);
      await PublicDataSource.query(`CREATE SCHEMA IF NOT EXISTS "${tenant.schema_name}"`);
      
      // Update tenant as schema created
      await PublicDataSource.query(`
        UPDATE "public"."tenants"
        SET "isSchemaCreated" = true
        WHERE "id" = '${tenant.id}'
      `);
    }
    
    console.log('All tenants created successfully!');
  } catch (error) {
    console.error('Error seeding tenants manually:', error);
  } finally {
    await PublicDataSource.destroy();
  }
}

seedTenantsManually()
  .then(() => console.log('Done'))
  .catch(error => console.error('Error:', error));
