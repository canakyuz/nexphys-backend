import { PublicDataSource } from '../shared/database/config/public-connection';
import * as bcrypt from 'bcrypt';

async function seedTestUsers() {
  try {
    console.log('Initializing public data source...');
    await PublicDataSource.initialize();
    console.log('Public data source initialized successfully!');
    
    // Get all tenant schemas
    console.log('Fetching all tenant schemas...');
    const tenants = await PublicDataSource.query(`
      SELECT * FROM "public"."tenants"
    `);
    
    // Standard password for all test users
    const testPassword = 'Test123!';
    const passwordHash = await bcrypt.hash(testPassword, 10);
    
    // Seed users in each tenant schema
    for (const tenant of tenants) {
      console.log(`Seeding test users for tenant: ${tenant.name} (${tenant.schema_name})...`);
      
      // First, make sure users table exists
      await PublicDataSource.query(`
        CREATE TABLE IF NOT EXISTS "${tenant.schema_name}"."users" (
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
      
      // Insert users specific to tenant type
      switch(tenant.tenantType) {
        case 'GYM':
          await seedGymUsers(tenant.schema_name, passwordHash);
          break;
        case 'STUDIO':
          await seedStudioUsers(tenant.schema_name, passwordHash);
          break;
        case 'PERSONAL_TRAINER':
          await seedPTUsers(tenant.schema_name, passwordHash);
          break;
        case 'ENTERPRISE':
          await seedEnterpriseUsers(tenant.schema_name, passwordHash);
          break;
        default:
          console.log(`Unknown tenant type: ${tenant.tenantType}`);
      }
      
      console.log(`Test users seeded for tenant: ${tenant.name}`);
    }
    
    console.log('All test users seeded successfully!');
  } catch (error) {
    console.error('Error seeding test users:', error);
  } finally {
    await PublicDataSource.destroy();
  }
}

async function seedGymUsers(schemaName: string, passwordHash: string) {
  // Insert GYM users
  await PublicDataSource.query(`
    INSERT INTO "${schemaName}"."users" (
      "id", "email", "password", "first_name", "last_name", "status", "role", "created_at", "updated_at"
    ) VALUES 
    (uuid_generate_v4(), 'owner@fitmax-gym.test', '${passwordHash}', 'Gym', 'Owner', 'ACTIVE', 'GYM_OWNER', NOW(), NOW()),
    (uuid_generate_v4(), 'manager@fitmax-gym.test', '${passwordHash}', 'Gym', 'Manager', 'ACTIVE', 'GYM_MANAGER', NOW(), NOW()),
    (uuid_generate_v4(), 'coach@fitmax-gym.test', '${passwordHash}', 'Gym', 'Coach', 'ACTIVE', 'GYM_COACH', NOW(), NOW()),
    (uuid_generate_v4(), 'member@fitmax-gym.test', '${passwordHash}', 'Gym', 'Member', 'ACTIVE', 'GYM_MEMBER', NOW(), NOW()),
    (uuid_generate_v4(), 'test@fitmax-gym.test', '${passwordHash}', 'Test', 'User', 'ACTIVE', 'GYM_MEMBER', NOW(), NOW())
    ON CONFLICT ("email") DO NOTHING;
  `);
}

async function seedStudioUsers(schemaName: string, passwordHash: string) {
  // Insert STUDIO users
  await PublicDataSource.query(`
    INSERT INTO "${schemaName}"."users" (
      "id", "email", "password", "first_name", "last_name", "status", "role", "created_at", "updated_at"
    ) VALUES 
    (uuid_generate_v4(), 'owner@zen-yoga.test', '${passwordHash}', 'Studio', 'Owner', 'ACTIVE', 'STUDIO_OWNER', NOW(), NOW()),
    (uuid_generate_v4(), 'manager@zen-yoga.test', '${passwordHash}', 'Studio', 'Manager', 'ACTIVE', 'STUDIO_MANAGER', NOW(), NOW()),
    (uuid_generate_v4(), 'instructor@zen-yoga.test', '${passwordHash}', 'Yoga', 'Instructor', 'ACTIVE', 'STUDIO_INSTRUCTOR', NOW(), NOW()),
    (uuid_generate_v4(), 'member@zen-yoga.test', '${passwordHash}', 'Studio', 'Member', 'ACTIVE', 'STUDIO_MEMBER', NOW(), NOW()),
    (uuid_generate_v4(), 'test@zen-yoga.test', '${passwordHash}', 'Test', 'User', 'ACTIVE', 'STUDIO_MEMBER', NOW(), NOW())
    ON CONFLICT ("email") DO NOTHING;
  `);
}

async function seedPTUsers(schemaName: string, passwordHash: string) {
  // Insert PERSONAL_TRAINER users
  await PublicDataSource.query(`
    INSERT INTO "${schemaName}"."users" (
      "id", "email", "password", "first_name", "last_name", "status", "role", "created_at", "updated_at"
    ) VALUES 
    (uuid_generate_v4(), 'coach@elite-pt.test', '${passwordHash}', 'Personal', 'Trainer', 'ACTIVE', 'COACH', NOW(), NOW()),
    (uuid_generate_v4(), 'client1@elite-pt.test', '${passwordHash}', 'Client', 'One', 'ACTIVE', 'CLIENT', NOW(), NOW()),
    (uuid_generate_v4(), 'client2@elite-pt.test', '${passwordHash}', 'Client', 'Two', 'ACTIVE', 'CLIENT', NOW(), NOW()),
    (uuid_generate_v4(), 'test@elite-pt.test', '${passwordHash}', 'Test', 'User', 'ACTIVE', 'CLIENT', NOW(), NOW())
    ON CONFLICT ("email") DO NOTHING;
  `);
}

async function seedEnterpriseUsers(schemaName: string, passwordHash: string) {
  // Insert ENTERPRISE users
  await PublicDataSource.query(`
    INSERT INTO "${schemaName}"."users" (
      "id", "email", "password", "first_name", "last_name", "status", "role", "created_at", "updated_at"
    ) VALUES 
    (uuid_generate_v4(), 'admin@techcorp-wellness.test', '${passwordHash}', 'Wellness', 'Admin', 'ACTIVE', 'WELLNESS_ADMIN', NOW(), NOW()),
    (uuid_generate_v4(), 'coach@techcorp-wellness.test', '${passwordHash}', 'Wellness', 'Coach', 'ACTIVE', 'WELLNESS_COACH', NOW(), NOW()),
    (uuid_generate_v4(), 'employee1@techcorp-wellness.test', '${passwordHash}', 'Employee', 'One', 'ACTIVE', 'EMPLOYEE', NOW(), NOW()),
    (uuid_generate_v4(), 'employee2@techcorp-wellness.test', '${passwordHash}', 'Employee', 'Two', 'ACTIVE', 'EMPLOYEE', NOW(), NOW()),
    (uuid_generate_v4(), 'test@techcorp-wellness.test', '${passwordHash}', 'Test', 'User', 'ACTIVE', 'EMPLOYEE', NOW(), NOW())
    ON CONFLICT ("email") DO NOTHING;
  `);
}

seedTestUsers()
  .then(() => console.log('Done'))
  .catch(error => console.error('Error:', error));
