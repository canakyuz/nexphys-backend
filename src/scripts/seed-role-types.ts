import { PublicDataSource } from '../shared/database/config/public-connection';

async function seedRoleTypes() {
  try {
    console.log('Initializing public data source...');
    await PublicDataSource.initialize();
    console.log('Public data source initialized successfully!');
    
    // Get all tenant schemas
    console.log('Fetching all tenant schemas...');
    const tenants = await PublicDataSource.query(`
      SELECT * FROM "public"."tenants"
    `);
    
    // Seed role types in each tenant schema
    for (const tenant of tenants) {
      console.log(`Seeding role types for tenant: ${tenant.name} (${tenant.schema_name})...`);
      
      // First, make sure role_types table exists
      await PublicDataSource.query(`
        CREATE TABLE IF NOT EXISTS "${tenant.schema_name}"."role_types" (
          "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
          "name" VARCHAR(255) NOT NULL,
          "code" VARCHAR(50) NOT NULL UNIQUE,
          "description" TEXT,
          "level" VARCHAR(50) NOT NULL,
          "category" VARCHAR(50) NOT NULL,
          "is_active" BOOLEAN NOT NULL DEFAULT true,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          PRIMARY KEY ("id")
        )
      `);
      
      // Insert roles specific to tenant type
      switch(tenant.tenantType) {
        case 'GYM':
          await seedGymRoleTypes(tenant.schema_name);
          break;
        case 'STUDIO':
          await seedStudioRoleTypes(tenant.schema_name);
          break;
        case 'PERSONAL_TRAINER':
          await seedPTRoleTypes(tenant.schema_name);
          break;
        case 'ENTERPRISE':
          await seedEnterpriseRoleTypes(tenant.schema_name);
          break;
        default:
          console.log(`Unknown tenant type: ${tenant.tenantType}`);
      }
      
      console.log(`Role types seeded for tenant: ${tenant.name}`);
    }
    
    // Also seed in tenant_default schema
    console.log('Seeding role types in tenant_default schema...');
    await PublicDataSource.query(`
      CREATE TABLE IF NOT EXISTS "tenant_default"."role_types" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "name" VARCHAR(255) NOT NULL,
        "code" VARCHAR(50) NOT NULL UNIQUE,
        "description" TEXT,
        "level" VARCHAR(50) NOT NULL,
        "category" VARCHAR(50) NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      )
    `);
    
    // Common role types for all tenant types
    await seedCommonRoleTypes('tenant_default');
    
    console.log('All role types seeded successfully!');
  } catch (error) {
    console.error('Error seeding role types:', error);
  } finally {
    await PublicDataSource.destroy();
  }
}

async function seedCommonRoleTypes(schemaName: string) {
  // Insert base admin roles
  await PublicDataSource.query(`
    INSERT INTO "${schemaName}"."role_types" (
      "id", "name", "code", "description", "level", "category", "is_active", "created_at", "updated_at"
    ) VALUES (
      uuid_generate_v4(), 'System Administrator', 'SYSTEM_ADMIN', 'Full system administrator with all permissions',
      'ADMIN', 'SYSTEM', true, NOW(), NOW()
    ) ON CONFLICT ("code") DO NOTHING;
  `);
}

async function seedGymRoleTypes(schemaName: string) {
  // Insert common roles
  await seedCommonRoleTypes(schemaName);
  
  // Insert GYM specific roles
  await PublicDataSource.query(`
    INSERT INTO "${schemaName}"."role_types" (
      "id", "name", "code", "description", "level", "category", "is_active", "created_at", "updated_at"
    ) VALUES 
    (uuid_generate_v4(), 'Gym Owner', 'GYM_OWNER', 'Owner of the gym with administrative permissions', 
     'ADMIN', 'GYM', true, NOW(), NOW()),
    (uuid_generate_v4(), 'Gym Manager', 'GYM_MANAGER', 'Manager with administrative permissions', 
     'MANAGER', 'GYM', true, NOW(), NOW()),
    (uuid_generate_v4(), 'Gym Coach', 'GYM_COACH', 'Fitness coach/trainer for the gym', 
     'STAFF', 'GYM', true, NOW(), NOW()),
    (uuid_generate_v4(), 'Gym Member', 'GYM_MEMBER', 'Regular gym member', 
     'MEMBER', 'GYM', true, NOW(), NOW())
    ON CONFLICT ("code") DO NOTHING;
  `);
}

async function seedStudioRoleTypes(schemaName: string) {
  // Insert common roles
  await seedCommonRoleTypes(schemaName);
  
  // Insert STUDIO specific roles
  await PublicDataSource.query(`
    INSERT INTO "${schemaName}"."role_types" (
      "id", "name", "code", "description", "level", "category", "is_active", "created_at", "updated_at"
    ) VALUES 
    (uuid_generate_v4(), 'Studio Owner', 'STUDIO_OWNER', 'Owner of the studio with administrative permissions', 
     'ADMIN', 'STUDIO', true, NOW(), NOW()),
    (uuid_generate_v4(), 'Studio Manager', 'STUDIO_MANAGER', 'Manager with administrative permissions', 
     'MANAGER', 'STUDIO', true, NOW(), NOW()),
    (uuid_generate_v4(), 'Studio Instructor', 'STUDIO_INSTRUCTOR', 'Instructor for classes', 
     'STAFF', 'STUDIO', true, NOW(), NOW()),
    (uuid_generate_v4(), 'Studio Member', 'STUDIO_MEMBER', 'Regular studio member', 
     'MEMBER', 'STUDIO', true, NOW(), NOW())
    ON CONFLICT ("code") DO NOTHING;
  `);
}

async function seedPTRoleTypes(schemaName: string) {
  // Insert common roles
  await seedCommonRoleTypes(schemaName);
  
  // Insert PERSONAL_TRAINER specific roles
  await PublicDataSource.query(`
    INSERT INTO "${schemaName}"."role_types" (
      "id", "name", "code", "description", "level", "category", "is_active", "created_at", "updated_at"
    ) VALUES 
    (uuid_generate_v4(), 'Coach', 'COACH', 'Personal trainer/coach', 
     'ADMIN', 'PT', true, NOW(), NOW()),
    (uuid_generate_v4(), 'Client', 'CLIENT', 'Client of the personal trainer', 
     'MEMBER', 'PT', true, NOW(), NOW())
    ON CONFLICT ("code") DO NOTHING;
  `);
}

async function seedEnterpriseRoleTypes(schemaName: string) {
  // Insert common roles
  await seedCommonRoleTypes(schemaName);
  
  // Insert ENTERPRISE specific roles
  await PublicDataSource.query(`
    INSERT INTO "${schemaName}"."role_types" (
      "id", "name", "code", "description", "level", "category", "is_active", "created_at", "updated_at"
    ) VALUES 
    (uuid_generate_v4(), 'Wellness Admin', 'WELLNESS_ADMIN', 'Wellness program administrator', 
     'ADMIN', 'ENTERPRISE', true, NOW(), NOW()),
    (uuid_generate_v4(), 'Wellness Coach', 'WELLNESS_COACH', 'Corporate wellness coach', 
     'STAFF', 'ENTERPRISE', true, NOW(), NOW()),
    (uuid_generate_v4(), 'Employee', 'EMPLOYEE', 'Employee participating in wellness program', 
     'MEMBER', 'ENTERPRISE', true, NOW(), NOW())
    ON CONFLICT ("code") DO NOTHING;
  `);
}

seedRoleTypes()
  .then(() => console.log('Done'))
  .catch(error => console.error('Error:', error));
