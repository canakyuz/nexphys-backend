import * as Logger from '../../../utils/logger';
import * as Prompts from '../../../utils/prompts';
import * as DbUtils from '../../../utils/db';
import * as SchemaUtils from '../../../utils/schema';
import { PublicDataSource } from '@/shared/database/config/public-connection';

interface SetupDevOptions {
  clean?: boolean;
  seed?: boolean;
}

const DEMO_TENANTS = [
  {
    domain: 'fitmax-gym',
    name: 'FitMax Gym',
    type: 'GYM',
    adminEmail: 'owner@fitmax-gym.test',
  },
  {
    domain: 'zen-yoga',
    name: 'Zen Yoga Studio',
    type: 'STUDIO',
    adminEmail: 'owner@zen-yoga.test',
  },
  {
    domain: 'elite-pt',
    name: 'Elite Personal Training',
    type: 'PERSONAL_TRAINER',
    adminEmail: 'coach@elite-pt.test',
  },
  {
    domain: 'techcorp-wellness',
    name: 'TechCorp Wellness',
    type: 'ENTERPRISE',
    adminEmail: 'admin@techcorp-wellness.test',
  },
];

/**
 * Geliştirme ortamı kurulum komutu
 * Yeni veritabanı mimarisine uygun olarak geliştirme ortamını hazırlar
 */
export const execute = async (options: SetupDevOptions): Promise<void> => {
  try {
    Logger.logHeader('NexPhys Development Environment Setup');
    
    // Temiz kurulum mu?
    const cleanInstall = options.clean || false;
    
    if (cleanInstall) {
      Logger.logWarning('This will drop all existing schemas and recreate them');
      const confirmed = await Prompts.askConfirmation('Are you sure you want to proceed?');
      
      if (!confirmed) {
        Logger.logInfo('Setup cancelled');
        return;
      }
    }
    
    // 1. Sys şemasını oluştur
    await setupSysSchema(cleanInstall);
    
    // 2. Common şemasını oluştur
    await setupCommonSchema(cleanInstall);
    
    // 3. Demo tenantları oluştur
    if (options.seed || await Prompts.askConfirmation('Do you want to create demo tenants?')) {
      await createDemoTenants();
    }
    
    Logger.logComplete('Development environment setup');
    Logger.logSuccess('NexPhys development environment is ready!');
    
  } catch (error) {
    Logger.logError('Error setting up development environment', error);
  }
};

/**
 * Sys şemasını oluştur
 */
const setupSysSchema = async (cleanInstall: boolean): Promise<void> => {
  Logger.logSubHeader('Setting up sys schema');
  
  const schemaName = DbUtils.SCHEMA_TYPES.SYS;
  
  // Şema var mı kontrol et
  const exists = await DbUtils.schemaExists(schemaName);
  
  if (exists && cleanInstall) {
    // Şemayı sil
    Logger.logInfo(`Dropping existing sys schema`);
    await DbUtils.dropSchema(schemaName);
  }
  
  // Şemayı oluştur
  if (!exists || cleanInstall) {
    Logger.logInfo(`Creating sys schema`);
    await DbUtils.createSchema(schemaName);
  } else {
    Logger.logInfo(`Sys schema already exists`);
  }
  
  // DataSource oluştur
  const dataSource = await SchemaUtils.setupSchema('', DbUtils.SCHEMA_TYPES.SYS);
  
  if (!dataSource) {
    Logger.logError('Failed to setup sys schema');
    return;
  }
  
  // Migration'ları çalıştır
  Logger.logInfo('Running migrations for sys schema');
  const success = await SchemaUtils.runMigrations(dataSource);
  
  if (success) {
    Logger.logSuccess('Migrations for sys schema completed');
  } else {
    Logger.logError('Failed to run migrations for sys schema');
  }
  
  await dataSource.destroy();
};

/**
 * Common şemasını oluştur
 */
const setupCommonSchema = async (cleanInstall: boolean): Promise<void> => {
  Logger.logSubHeader('Setting up common schema');
  
  const schemaName = DbUtils.SCHEMA_TYPES.COMMON;
  
  // Şema var mı kontrol et
  const exists = await DbUtils.schemaExists(schemaName);
  
  if (exists && cleanInstall) {
    // Şemayı sil
    Logger.logInfo(`Dropping existing common schema`);
    await DbUtils.dropSchema(schemaName);
  }
  
  // Şemayı oluştur
  if (!exists || cleanInstall) {
    Logger.logInfo(`Creating common schema`);
    await DbUtils.createSchema(schemaName);
  } else {
    Logger.logInfo(`Common schema already exists`);
  }
  
  // DataSource oluştur
  const dataSource = await SchemaUtils.setupSchema('', DbUtils.SCHEMA_TYPES.COMMON);
  
  if (!dataSource) {
    Logger.logError('Failed to setup common schema');
    return;
  }
  
  // Migration'ları çalıştır
  Logger.logInfo('Running migrations for common schema');
  const success = await SchemaUtils.runMigrations(dataSource);
  
  if (success) {
    Logger.logSuccess('Migrations for common schema completed');
  } else {
    Logger.logError('Failed to run migrations for common schema');
  }
  
  await dataSource.destroy();
};

/**
 * Demo tenantları oluştur
 */
const createDemoTenants = async (): Promise<void> => {
  Logger.logSubHeader('Creating demo tenants');
  
  for (const tenant of DEMO_TENANTS) {
    Logger.logInfo(`Creating tenant: ${tenant.name} (${tenant.domain})`);
    
    // Tenant varlığını kontrol et
    if (await DbUtils.tenantExists(tenant.domain)) {
      Logger.logWarning(`Tenant ${tenant.domain} already exists, skipping`);
      continue;
    }
    
    // Sys şeması için DataSource kontrol et
    const sysDataSource = await SchemaUtils.setupSchema('', DbUtils.SCHEMA_TYPES.SYS);
    
    if (!sysDataSource) {
      Logger.logError('Failed to setup sys schema');
      continue;
    }
    
    // Tenant repository'si oluştur
    const tenantRepository = sysDataSource.getRepository('Tenant');
    
    // Tenant entity'si oluştur
    const tenantEntity = tenantRepository.create({
      name: tenant.name,
      domain: tenant.domain,
      tenantType: tenant.type,
      status: 'TRIAL',
      trialStartDate: new Date(),
      trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün
      contact: {
        email: tenant.adminEmail,
      },
    });
    
    // Tenant'ı kaydet
    await tenantRepository.save(tenantEntity);
    Logger.logSuccess(`Tenant record created: ${tenant.name}`);
    
    // Tenant şemasını oluştur
    Logger.logInfo(`Creating schema for tenant: ${tenant.domain}`);
    const createdSchema = await DbUtils.createTenantSchema(tenant.domain);
    
    if (!createdSchema) {
      Logger.logError(`Failed to create schema for tenant: ${tenant.domain}`);
      continue;
    }
    
    Logger.logSuccess(`Created schema for tenant: ${tenant.domain}`);
    
    // Migration'ları çalıştır
    Logger.logInfo(`Running migrations for tenant: ${tenant.domain}`);
    
    const dataSource = await SchemaUtils.setupSchema(tenant.domain, DbUtils.SCHEMA_TYPES.TENANT);
    
    if (!dataSource) {
      Logger.logError(`Failed to setup tenant schema for: ${tenant.domain}`);
      continue;
    }
    
    const success = await SchemaUtils.runMigrations(dataSource);
    
    if (success) {
      Logger.logSuccess(`Migrations completed for tenant: ${tenant.domain}`);
    } else {
      Logger.logError(`Failed to run migrations for tenant: ${tenant.domain}`);
    }
    
    await dataSource.destroy();
    
    // Tenant için seed data oluştur
    Logger.logInfo(`Creating seed data for tenant: ${tenant.domain}`);
    // TODO: Seed data oluşturma işlemleri eklenecek
    
    Logger.logSuccess(`Demo tenant created: ${tenant.name} (${tenant.domain})`);
  }
  
  Logger.logSuccess('Demo tenants created successfully');
}; 