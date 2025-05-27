#!/usr/bin/env node
/**
 * Nexphys Tenant Users Seeder
 * 
 * Bu script, verilen tenant domain adına göre veya tüm tenantlar için
 * kullanıcı ve rol seed işlemlerini gerçekleştirir.
 * 
 * Kullanım:
 *   NODE_ENV=development DB_HOST=localhost DB_PORT=5432 node scripts/seed-tenant-users.js [tenant-domain]
 */

const { Client } = require('pg');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nexfit_db',
  user: process.env.DB_USER || 'nexfit_user',
  password: process.env.DB_PASSWORD || 'nexfit_password',
};

// Parse command line arguments
const targetTenant = process.argv[2]; // Specific tenant domain if provided

// Main function
async function main() {
  console.log('🌱 Nexphys Tenant User Seeder');
  console.log('===========================');
  
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log(`✅ Connected to database: ${config.database} at ${config.host}:${config.port}`);
    
    // Get tenants
    let tenants;
    if (targetTenant) {
      const { rows } = await client.query(
        'SELECT id, name, domain, schema_name, tenant_type FROM tenants WHERE domain = $1',
        [targetTenant]
      );
      
      if (rows.length === 0) {
        throw new Error(`Tenant with domain "${targetTenant}" not found`);
      }
      
      tenants = rows;
      console.log(`🎯 Targeting specific tenant: ${targetTenant}`);
    } else {
      const { rows } = await client.query(
        'SELECT id, name, domain, schema_name, tenant_type FROM tenants ORDER BY created_at'
      );
      
      if (rows.length === 0) {
        throw new Error('No tenants found in the database');
      }
      
      tenants = rows;
      console.log(`🏢 Found ${tenants.length} tenants`);
    }
    
    // Process each tenant
    for (const tenant of tenants) {
      console.log(`\n📝 Processing tenant: ${tenant.name} (${tenant.domain}) - Type: ${tenant.tenant_type}`);
      
      // Ensure schema exists
      console.log(`  ▶️ Ensuring schema ${tenant.schema_name} exists...`);
      await client.query(`CREATE SCHEMA IF NOT EXISTS "${tenant.schema_name}"`);
      
      // Run migrations for tenant schema
      console.log(`  ▶️ Running migrations for tenant schema...`);
      await runMigrations(tenant.schema_name);
      
      // Update schema creation status
      await client.query(
        'UPDATE tenants SET is_schema_created = true WHERE id = $1',
        [tenant.id]
      );
      
      console.log(`  ✅ Tenant ${tenant.domain} processed successfully`);
    }
    
    console.log('\n🎉 All tenants processed successfully!');
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migrations for a tenant schema
async function runMigrations(schemaName) {
  try {
    // Set environment variables for the migration
    const env = {
      ...process.env,
      DB_SCHEMA: schemaName,
      TYPEORM_SCHEMA: schemaName,
    };
    
    // Run TypeORM migrations
    const cmd = `npx typeorm migration:run -d ./src/shared/database/config/tenant-connection.ts`;
    
    execSync(cmd, { 
      env,
      stdio: 'inherit',
      encoding: 'utf-8'
    });
    
    return true;
  } catch (error) {
    console.error(`  ❌ Migration error for schema ${schemaName}: ${error.message}`);
    throw error;
  }
}

// Run the script
main().catch(console.error);
