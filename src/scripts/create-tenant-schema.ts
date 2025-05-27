import { PublicDataSource } from '../shared/database/config/public-connection';

async function createTenantSchema() {
  try {
    console.log('Initializing public data source...');
    await PublicDataSource.initialize();
    console.log('Public data source initialized successfully!');
    
    console.log('Creating tenant_default schema...');
    await PublicDataSource.query(`CREATE SCHEMA IF NOT EXISTS "tenant_default"`);
    console.log('tenant_default schema created successfully!');
    
    // Iterate through all tenants in the database and create their schemas
    console.log('Creating schemas for all tenants...');
    const tenants = await PublicDataSource.query(`
      SELECT * FROM "public"."tenants"
    `);
    
    for (const tenant of tenants) {
      console.log(`Creating schema for tenant: ${tenant.name} (${tenant.schema_name})...`);
      await PublicDataSource.query(`CREATE SCHEMA IF NOT EXISTS "${tenant.schema_name}"`);
      
      // Mark the tenant as having its schema created
      await PublicDataSource.query(`
        UPDATE "public"."tenants"
        SET "isSchemaCreated" = true
        WHERE "id" = '${tenant.id}'
      `);
      
      console.log(`Schema "${tenant.schema_name}" created successfully!`);
    }
    
    console.log('All tenant schemas created successfully!');
  } catch (error) {
    console.error('Error creating tenant schemas:', error);
  } finally {
    await PublicDataSource.destroy();
  }
}

createTenantSchema()
  .then(() => console.log('Done'))
  .catch(error => console.error('Error:', error));
