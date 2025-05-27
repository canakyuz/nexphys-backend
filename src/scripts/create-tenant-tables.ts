import { PublicDataSource } from '../shared/database/config/public-connection';

async function createTenantTables() {
  try {
    console.log('Initializing public data source...');
    await PublicDataSource.initialize();
    console.log('Public data source initialized successfully!');
    
    // Get all tenant schemas
    console.log('Fetching all tenant schemas...');
    const tenants = await PublicDataSource.query(`
      SELECT * FROM "public"."tenants"
    `);
    
    // Create tables in each tenant schema
    for (const tenant of tenants) {
      console.log(`Creating tables for tenant: ${tenant.name} (${tenant.schema_name})...`);
      
      // Create role_types table
      console.log(`Creating role_types table in ${tenant.schema_name}...`);
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
      
      // Create users table
      console.log(`Creating users table in ${tenant.schema_name}...`);
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
      
      // Also create a tenant_default schema's role_types and users tables
      if (tenant.schema_name !== 'tenant_default') {
        console.log(`Creating tables in tenant_default...`);
        
        // Create role_types table in tenant_default
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
        
        // Create users table in tenant_default
        await PublicDataSource.query(`
          CREATE TABLE IF NOT EXISTS "tenant_default"."users" (
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
      }
      
      console.log(`Tables created for tenant: ${tenant.name}`);
    }
    
    console.log('All tenant tables created successfully!');
  } catch (error) {
    console.error('Error creating tenant tables:', error);
  } finally {
    await PublicDataSource.destroy();
  }
}

createTenantTables()
  .then(() => console.log('Done'))
  .catch(error => console.error('Error:', error));
