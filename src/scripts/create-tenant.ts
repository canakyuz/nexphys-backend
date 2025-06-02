import { PublicDataSource } from '@/shared/database/config';
import { TenantService } from '@/modules/tenants/services/tenant.service';
import { logger } from '@/shared/utils/logger.util';

/**
 * Yeni bir tenant oluşturmak için kullanılan script
 * Örnek kullanım:
 * npm run nexphys:create-tenant -- --name "Tenant Adı" --code "tenant-kodu" --admin-email "admin@email.com"
 */
async function createTenant() {
  try {
    // Veritabanı bağlantısını başlat
    if (!PublicDataSource.isInitialized) {
      await PublicDataSource.initialize();
      logger.info('✅ Database connection established');
    }

    // Komut satırı argümanlarını parse et
    const args = process.argv.slice(2);
    const params: Record<string, string> = {};

    // --name "Example Gym" --code "example-gym" --admin-email "admin@example.com" gibi argümanları parse et
    for (let i = 0; i < args.length; i += 2) {
      if (args[i].startsWith('--')) {
        const key = args[i].slice(2);
        const value = args[i + 1];
        params[key] = value;
      }
    }

    // Gerekli parametrelerin kontrolü
    if (!params.name || !params.code || !params.adminEmail) {
      logger.error('❌ Missing required parameters. Usage: npm run nexphys:create-tenant -- --name "Tenant Name" --code "tenant-code" --admin-email "admin@email.com"');
      process.exit(1);
    }

    // Tenant servisini başlat
    const tenantService = new TenantService();

    // Tenant oluşturma
    const tenant = await tenantService.createTenant({
      name: params.name,
      code: params.code,
      adminEmail: params.adminEmail,
      status: 'active',
      settings: {
        logo: null,
        primaryColor: '#3498db',
        secondaryColor: '#2c3e50',
        appName: params.name,
      }
    });

    logger.info(`✅ Tenant created successfully with ID: ${tenant.id}`);
    logger.info(`✅ Tenant Name: ${tenant.name}`);
    logger.info(`✅ Tenant Code: ${tenant.code}`);
    logger.info(`✅ Admin Email: ${params.adminEmail}`);

    // Tenant şemasını ve tabloları oluştur
    logger.info('📦 Creating tenant schema and tables...');
    await tenantService.initializeTenantSchema(tenant.code);
    logger.info(`✅ Tenant schema '${tenant.code}' initialized successfully`);

    // İşlem tamamlandı
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error creating tenant:', error);
    process.exit(1);
  }
}

// Scripti çalıştır
createTenant();
