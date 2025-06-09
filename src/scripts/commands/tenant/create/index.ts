import { PublicDataSource } from '@/shared/database/config/public-connection';
import { TenantStatus, TenantType } from '@/shared/database/entities/public/tenant.entity';
import * as Logger from '../../../utils/logger';
import * as Prompts from '../../../utils/prompts';
import * as DbUtils from '../../../utils/db';
import * as SchemaUtils from '../../../utils/schema';

interface TenantCreateOptions {
  domain?: string;
  name?: string;
  type?: string;
  email?: string;
}

/**
 * Tenant oluşturma komutu
 * Yeni veritabanı mimarisine uygun, sys şemasında tenant kaydı oluşturur
 * ve ilgili tenant şemasını yaratır
 */
export const execute = async (options: TenantCreateOptions): Promise<void> => {
  try {
    Logger.logHeader('NexPhys Tenant Creation');
    Logger.logStart('Initializing tenant creation process');
    
    // Domain bilgisini al
    const domain = options.domain || await Prompts.askDomain();
    
    // Tenant varlığını kontrol et
    if (await DbUtils.tenantExists(domain)) {
      Logger.logError(`Tenant with domain '${domain}' already exists`);
      return;
    }
    
    // Tenant adını al
    const name = options.name || await Prompts.askQuestion('Enter tenant name:');
    
    // Tenant türünü al
    const type = options.type || await Prompts.askTenantType();
    
    // Admin email'ini al
    const email = options.email || await Prompts.askEmail();
    
    // Tenant özeti
    Logger.logSubHeader('Tenant Summary');
    Logger.logDetail('Domain', domain);
    Logger.logDetail('Name', name);
    Logger.logDetail('Type', type);
    Logger.logDetail('Admin Email', email);
    
    // Onay al
    const confirmed = await Prompts.askConfirmation('Do you want to create this tenant?');
    
    if (!confirmed) {
      Logger.logInfo('Tenant creation cancelled');
      return;
    }
    
    // Sys şemasında tenant kaydı oluştur
    Logger.logStart('Creating tenant record in sys schema');
    
    // sys şeması için DataSource kontrol et
    const sysDataSource = await SchemaUtils.setupSchema(domain, DbUtils.SCHEMA_TYPES.SYS);
    
    if (!sysDataSource) {
      Logger.logError('Failed to setup sys schema');
      return;
    }
    
    // Tenant repository'si oluştur
    const tenantRepository = sysDataSource.getRepository('Tenant');
    
    // Tenant entity'si oluştur
    const tenant = tenantRepository.create({
      name,
      domain,
      tenantType: type as TenantType,
      status: TenantStatus.TRIAL,
      trialStartDate: new Date(),
      trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün
      contact: {
        email,
      },
    });
    
    // Tenant'ı kaydet
    await tenantRepository.save(tenant);
    Logger.logSuccess('Tenant record created in sys schema');
    
    // Tenant şemasını oluştur
    Logger.logStart('Creating tenant schema');
    const createdSchema = await DbUtils.createTenantSchema(domain);
    
    if (!createdSchema) {
      Logger.logError('Failed to create tenant schema');
      return;
    }
    
    Logger.logSuccess(`Created schema: ${createdSchema}`);
    
    // Migration'ları çalıştır
    Logger.logStart('Running migrations for tenant schema');
    
    const dataSource = await SchemaUtils.setupSchema(domain, DbUtils.SCHEMA_TYPES.TENANT);
    
    if (!dataSource) {
      Logger.logError('Failed to setup tenant schema');
      return;
    }
    
    const success = await SchemaUtils.runMigrations(dataSource);
    
    if (success) {
      Logger.logSuccess('Migrations for tenant schema completed');
    } else {
      Logger.logError('Failed to run migrations for tenant schema');
    }
    
    await dataSource.destroy();
    
    // Seed data oluştur
    Logger.logStart('Creating initial seed data for tenant');
    
    // TODO: Seed data işlemleri eklenecek
    
    Logger.logComplete('Tenant creation');
    Logger.logInfo(`Tenant '${name}' (${domain}) created successfully`);
    Logger.logInfo(`Admin user: ${email}`);
    
  } catch (error) {
    Logger.logError('Error creating tenant', error);
  } finally {
    // Bağlantıları kapat
    try {
      // await closeConnections();
    } catch (error) {
      Logger.logError('Error closing connections', error);
    }
  }
}; 