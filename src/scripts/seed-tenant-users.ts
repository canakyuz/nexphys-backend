/**
 * Nexphys Tenant Users Seeder
 * 
 * Bu script, verilen tenant domain adına göre veya tüm tenantlar için
 * kullanıcı ve rol seed işlemlerini gerçekleştirir.
 * 
 * Kullanım:
 *   npm run nexphys:seed:tenants -- [tenant-domain]
 */

import { Client } from 'pg';
import { execSync } from 'child_process';
import { logger } from '@/shared/utils/logger.util';
import { envConfig } from '@/config/env.config';

// Veritabanı yapılandırması
const dbConfig = {
  host: envConfig.DB_HOST,
  port: envConfig.DB_PORT,
  database: envConfig.DB_NAME,
  user: envConfig.DB_USER,
  password: envConfig.DB_PASSWORD,
};

// Komut satırı argümanlarını ayrıştırma
const targetTenant = process.argv[2]; // Eğer belirtilmişse belirli bir tenant domain'i

/**
 * Ana fonksiyon
 */
async function main(): Promise<void> {
  logger.info('🌱 Nexphys Tenant User Seeder');
  logger.info('===========================');

  const client = new Client(dbConfig);

  try {
    await client.connect();
    logger.info(`✅ Connected to database: ${dbConfig.database} at ${dbConfig.host}:${dbConfig.port}`);

    // Tenant'ları al
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
      logger.info(`🎯 Targeting specific tenant: ${targetTenant}`);
    } else {
      const { rows } = await client.query(
        'SELECT id, name, domain, schema_name, tenant_type FROM tenants ORDER BY created_at'
      );

      if (rows.length === 0) {
        throw new Error('No tenants found in the database');
      }

      tenants = rows;
      logger.info(`🏢 Found ${tenants.length} tenants`);
    }

    // Her tenant için işlem yap
    for (const tenant of tenants) {
      logger.info(`\n📝 Processing tenant: ${tenant.name} (${tenant.domain}) - Type: ${tenant.tenant_type}`);

      // Schema'nın varlığını doğrula
      logger.info(`  ▶️ Ensuring schema ${tenant.schema_name} exists...`);
      await client.query(`CREATE SCHEMA IF NOT EXISTS "${tenant.schema_name}"`);

      // Tenant schema için migration'ları çalıştır
      logger.info(`  ▶️ Running migrations for tenant schema...`);
      await runMigrations(tenant.schema_name);

      // Schema oluşturma durumunu güncelle
      await client.query(
        'UPDATE tenants SET is_schema_created = true WHERE id = $1',
        [tenant.id]
      );

      logger.info(`  ✅ Tenant ${tenant.domain} processed successfully`);
    }

    logger.info('\n🎉 All tenants processed successfully!');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Error: ${errorMessage}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

/**
 * Tenant schema için migration'ları çalıştır
 */
async function runMigrations(schemaName: string): Promise<boolean> {
  try {
    // Migration için çevre değişkenlerini ayarla
    const env = {
      ...process.env,
      DB_SCHEMA: schemaName,
      TYPEORM_SCHEMA: schemaName,
    };

    // TypeORM migration'larını çalıştır
    const cmd = `npx typeorm migration:run -d ./src/shared/database/config/tenant-connection.ts`;

    execSync(cmd, {
      env,
      stdio: 'inherit',
      encoding: 'utf-8'
    });

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Migration error for schema ${schemaName}: ${errorMessage}`);
    throw error;
  }
}

// Scripti çalıştır
main().catch((error) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error(`Unhandled error: ${errorMessage}`);
  process.exit(1);
});
