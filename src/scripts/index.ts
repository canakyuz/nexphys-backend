#!/usr/bin/env node
/**
 * nexphys Multi-Tenant Fitness Platform
 * Temel Geliştirme Araçları
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as Logger from './utils/logger';
import * as DbUtils from './utils/db';
import * as SchemaUtils from './utils/schema';
import * as Prompts from './utils/prompts';

// Ortam değişkenlerini yükle
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Komut satırı argümanlarını işle
const args = process.argv.slice(2);
const command = args[0];

// Ana giriş noktası
async function main() {
  try {
    Logger.logHeader('NexPhys Geliştirme Araçları');
    
    if (!command) {
      showHelp();
      return;
    }
    
    switch (command) {
      case 'setup-dev':
        await setupDev();
        break;
      case 'create-tenant':
        await createTenant();
        break;
      case 'create-schema':
        await createSchema();
        break;
      case 'setup-roles':
        await setupRoles();
        break;
      case 'help':
        showHelp();
        break;
      default:
        Logger.logError(`Bilinmeyen komut: ${command}`);
        showHelp();
        break;
    }
  } catch (error) {
    Logger.logError('Bir hata oluştu:', error);
    process.exit(1);
  }
}

// Yardım bilgisi göster
function showHelp() {
  Logger.logInfo('Kullanılabilir komutlar:');
  Logger.logListItem('setup-dev: Geliştirme ortamını hazırla');
  Logger.logListItem('create-tenant: Yeni tenant oluştur');
  Logger.logListItem('create-schema: Veritabanı şeması oluştur');
  Logger.logListItem('setup-roles: Tenant için roller oluştur');
  Logger.logListItem('help: Bu yardım bilgisini göster');
  
  Logger.logInfo('\nÖrnekler:');
  console.log('  npm run script -- setup-dev');
  console.log('  npm run script -- create-tenant');
  console.log('  npm run script -- create-schema');
  console.log('  npm run script -- setup-roles');
}

// Geliştirme ortamını hazırla
async function setupDev() {
  Logger.logSubHeader('Geliştirme Ortamı Kurulumu');
  
  // Temiz kurulum mu?
  const cleanInstall = args.includes('--clean') || args.includes('-c');
  
  if (cleanInstall) {
    Logger.logWarning('Bu işlem mevcut şemaları silecek!');
    const confirmed = await Prompts.askConfirmation('Devam etmek istiyor musunuz?');
    
    if (!confirmed) {
      Logger.logInfo('Kurulum iptal edildi');
      return;
    }
  }
  
  // 1. Sys şemasını oluştur
  await setupSystemSchema(cleanInstall);
  
  // 2. Common şemasını oluştur
  await setupCommonSchema(cleanInstall);
  
  // 3. Demo tenantları oluştur
  const createDemos = args.includes('--demo') || args.includes('-d');
  if (createDemos) {
    await createDemoTenants();
  }
  
  // 4. Rol bazlı test tenantları oluştur
  const createRoleBasedTenants = args.includes('--roles') || args.includes('-r');
  if (createRoleBasedTenants) {
    await createRoleBasedTestTenants();
  }
  
  Logger.logComplete('Geliştirme ortamı kurulumu tamamlandı');
}

// Sys şemasını oluştur
async function setupSystemSchema(cleanInstall: boolean) {
  Logger.logInfo('Sistem şeması oluşturuluyor...');
  
  const schemaName = DbUtils.SCHEMA_TYPES.SYS;
  
  // Şema var mı kontrol et
  const exists = await DbUtils.schemaExists(schemaName);
  
  if (exists && cleanInstall) {
    // Şemayı sil
    Logger.logInfo(`Mevcut sistem şeması siliniyor`);
    await DbUtils.dropSchema(schemaName);
  }
  
  // Şemayı oluştur
  if (!exists || cleanInstall) {
    Logger.logInfo(`Sistem şeması oluşturuluyor`);
    await DbUtils.createSchema(schemaName);
  } else {
    Logger.logInfo(`Sistem şeması zaten mevcut`);
  }
  
  // DataSource oluştur
  const dataSource = await SchemaUtils.setupSchema('', DbUtils.SCHEMA_TYPES.SYS);
  
  if (!dataSource) {
    Logger.logError('Sistem şeması oluşturulamadı');
    return;
  }
  
  // Migration'ları çalıştır
  Logger.logInfo('Sistem şeması için migration\'lar çalıştırılıyor');
  const success = await SchemaUtils.runMigrations(dataSource);
  
  if (success) {
    Logger.logSuccess('Sistem şeması için migration\'lar tamamlandı');
  } else {
    Logger.logError('Sistem şeması için migration\'lar çalıştırılamadı');
  }
  
  await dataSource.destroy();
}

// Common şemasını oluştur
async function setupCommonSchema(cleanInstall: boolean) {
  Logger.logInfo('Common şeması oluşturuluyor...');
  
  const schemaName = DbUtils.SCHEMA_TYPES.COMMON;
  
  // Şema var mı kontrol et
  const exists = await DbUtils.schemaExists(schemaName);
  
  if (exists && cleanInstall) {
    // Şemayı sil
    Logger.logInfo(`Mevcut common şeması siliniyor`);
    await DbUtils.dropSchema(schemaName);
  }
  
  // Şemayı oluştur
  if (!exists || cleanInstall) {
    Logger.logInfo(`Common şeması oluşturuluyor`);
    await DbUtils.createSchema(schemaName);
  } else {
    Logger.logInfo(`Common şeması zaten mevcut`);
  }
  
  // DataSource oluştur
  const dataSource = await SchemaUtils.setupSchema('', DbUtils.SCHEMA_TYPES.COMMON);
  
  if (!dataSource) {
    Logger.logError('Common şeması oluşturulamadı');
    return;
  }
  
  // Migration'ları çalıştır
  Logger.logInfo('Common şeması için migration\'lar çalıştırılıyor');
  const success = await SchemaUtils.runMigrations(dataSource);
  
  if (success) {
    Logger.logSuccess('Common şeması için migration\'lar tamamlandı');
  } else {
    Logger.logError('Common şeması için migration\'lar çalıştırılamadı');
  }
  
  await dataSource.destroy();
}

// Demo tenant'lar
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

// Demo tenant'ları oluştur
async function createDemoTenants() {
  Logger.logSubHeader('Demo tenant\'lar oluşturuluyor');
  
  for (const tenant of DEMO_TENANTS) {
    await createSingleTenant(tenant.domain, tenant.name, tenant.type, tenant.adminEmail);
  }
  
  Logger.logSuccess('Demo tenant\'lar oluşturuldu');
}

// Rol bazlı test tenant'ları oluştur
async function createRoleBasedTestTenants() {
  Logger.logSubHeader('Rol bazlı test tenant\'ları oluşturuluyor');
  
  // GYM rolleri için tenant'lar
  await createSingleTenant('gym-owner-tenant', 'Gym Owner Test', 'GYM', 'admin@gym-owner-tenant.test');
  await createSingleTenant('gym-coach-tenant', 'Gym Coach Test', 'GYM', 'admin@gym-coach-tenant.test');
  await createSingleTenant('gym-member-tenant', 'Gym Member Test', 'GYM', 'admin@gym-member-tenant.test');
  
  // STUDIO rolleri için tenant'lar
  await createSingleTenant('studio-owner-tenant', 'Studio Owner Test', 'STUDIO', 'admin@studio-owner-tenant.test');
  await createSingleTenant('studio-instructor-tenant', 'Studio Instructor Test', 'STUDIO', 'admin@studio-instructor-tenant.test');
  await createSingleTenant('studio-member-tenant', 'Studio Member Test', 'STUDIO', 'admin@studio-member-tenant.test');
  
  // PERSONAL_TRAINER rolleri için tenant'lar
  await createSingleTenant('personal-trainer-tenant', 'Personal Trainer Test', 'PERSONAL_TRAINER', 'admin@personal-trainer-tenant.test');
  await createSingleTenant('client-tenant', 'Client Test', 'PERSONAL_TRAINER', 'admin@client-tenant.test');
  
  // ENTERPRISE rolleri için tenant'lar
  await createSingleTenant('enterprise-admin-tenant', 'Enterprise Admin Test', 'ENTERPRISE', 'admin@enterprise-admin-tenant.test');
  
  Logger.logSuccess('Rol bazlı test tenant\'ları oluşturuldu');
}

// Yeni tenant oluştur
async function createTenant() {
  Logger.logSubHeader('Yeni Tenant Oluşturma');
  
  // Tenant bilgilerini al
  const domain = await Prompts.askDomain();
  const name = await Prompts.askInput('Tenant adı:');
  const type = await Prompts.askTenantType();
  const adminEmail = await Prompts.askInput('Admin e-posta adresi:');
  
  await createSingleTenant(domain, name, type, adminEmail);
}

// Tekil tenant oluşturma
async function createSingleTenant(domain: string, name: string, type: string, adminEmail: string) {
  Logger.logInfo(`Tenant oluşturuluyor: ${name} (${domain})`);
  
  // Tenant varlığını kontrol et
  if (await DbUtils.tenantExists(domain)) {
    Logger.logWarning(`Tenant ${domain} zaten mevcut, atlanıyor`);
    return;
  }
  
  // Sys şeması için DataSource kontrol et
  const sysDataSource = await SchemaUtils.setupSchema('', DbUtils.SCHEMA_TYPES.SYS);
  
  if (!sysDataSource) {
    Logger.logError('Sistem şemasına bağlanılamadı');
    return;
  }
  
  // Tenant repository'si oluştur
  const tenantRepository = sysDataSource.getRepository('Tenant');
  
  // Tenant entity'si oluştur
  const tenantEntity = tenantRepository.create({
    name,
    domain,
    tenantType: type,
    status: 'TRIAL',
    trialStartDate: new Date(),
    trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün
    contact: {
      email: adminEmail,
    }
  });
  
  // Tenant'ı kaydet
  await tenantRepository.save(tenantEntity);
  Logger.logSuccess(`Tenant kaydı oluşturuldu: ${name}`);
  
  // Tenant şemasını oluştur
  Logger.logInfo(`Tenant için şema oluşturuluyor: ${domain}`);
  const createdSchema = await DbUtils.createTenantSchema(domain);
  
  if (!createdSchema) {
    Logger.logError(`Tenant için şema oluşturulamadı: ${domain}`);
    return;
  }
  
  Logger.logSuccess(`Tenant için şema oluşturuldu: ${domain}`);
  
  // Migration'ları çalıştır
  Logger.logInfo(`Tenant için migration'lar çalıştırılıyor: ${domain}`);
  
  const dataSource = await SchemaUtils.setupSchema(domain, DbUtils.SCHEMA_TYPES.TENANT);
  
  if (!dataSource) {
    Logger.logError(`Tenant şemasına bağlanılamadı: ${domain}`);
    return;
  }
  
  const success = await SchemaUtils.runMigrations(dataSource);
  
  if (success) {
    Logger.logSuccess(`Tenant için migration'lar tamamlandı: ${domain}`);
  } else {
    Logger.logError(`Tenant için migration'lar çalıştırılamadı: ${domain}`);
  }
  
  await dataSource.destroy();
  
  // Tenant için seed data oluştur
  Logger.logInfo(`Tenant için temel veriler oluşturuluyor: ${domain}`);
  // TODO: Seed data oluşturma işlemleri
  
  Logger.logSuccess(`Tenant oluşturuldu: ${name} (${domain})`);
}

// Şema oluştur
async function createSchema() {
  Logger.logSubHeader('Şema Oluşturma');
  
  // Şema bilgilerini al
  const schemaType = await Prompts.askSchemaType();
  let schemaName = '';
  let domain = '';
  
  if (schemaType === DbUtils.SCHEMA_TYPES.TENANT) {
    domain = await Prompts.askDomain();
    schemaName = `tenant_${domain.replace(/[.-]/g, '_')}`;
  } else {
    schemaName = schemaType;
  }
  
  // Şemanın varlığını kontrol et
  const exists = await DbUtils.schemaExists(schemaName);
  
  if (exists) {
    Logger.logWarning(`Şema ${schemaName} zaten mevcut`);
    const overwrite = await Prompts.askConfirmation('Şemayı yeniden oluşturmak istiyor musunuz?');
    
    if (overwrite) {
      Logger.logInfo(`Şema siliniyor: ${schemaName}`);
      await DbUtils.dropSchema(schemaName);
    } else {
      Logger.logInfo('İşlem iptal edildi');
      return;
    }
  }
  
  // Şemayı oluştur
  Logger.logInfo(`Şema oluşturuluyor: ${schemaName}`);
  
  if (schemaType === DbUtils.SCHEMA_TYPES.TENANT) {
    await DbUtils.createTenantSchema(domain);
  } else {
    await DbUtils.createSchema(schemaName);
  }
  
  Logger.logSuccess(`Şema oluşturuldu: ${schemaName}`);
  
  // Migration'ları çalıştır
  Logger.logInfo(`Migration'lar çalıştırılıyor: ${schemaName}`);
  
  const dataSource = await SchemaUtils.setupSchema(
    schemaType === DbUtils.SCHEMA_TYPES.TENANT ? domain : '',
    schemaType
  );
  
  if (!dataSource) {
    Logger.logError(`Şemaya bağlanılamadı: ${schemaName}`);
    return;
  }
  
  const success = await SchemaUtils.runMigrations(dataSource);
  
  if (success) {
    Logger.logSuccess(`Migration'lar tamamlandı: ${schemaName}`);
  } else {
    Logger.logError(`Migration'lar çalıştırılamadı: ${schemaName}`);
  }
  
  await dataSource.destroy();
}

// Roller oluştur
async function setupRoles() {
  Logger.logSubHeader('Roller Oluşturma');
  
  // Tüm tenant'lar için mi?
  const allTenants = args.includes('--all') || args.includes('-a');
  
  if (allTenants) {
    // Sys şeması üzerinden tüm tenant'ları al
    const sysDataSource = await SchemaUtils.setupSchema('', DbUtils.SCHEMA_TYPES.SYS);
    
    if (!sysDataSource) {
      Logger.logError('Sistem şemasına bağlanılamadı');
      return;
    }
    
    // Tenant repository'si oluştur
    const tenantRepository = sysDataSource.getRepository('Tenant');
    
    // Tüm tenant'ları al
    const tenants = await tenantRepository.find();
    
    Logger.logInfo(`${tenants.length} tenant bulundu`);
    
    // Her tenant için roller oluştur
    for (const tenant of tenants) {
      await setupRolesForTenant(tenant.domain);
    }
    
    await sysDataSource.destroy();
    
    Logger.logComplete('Tüm tenant\'lar için roller oluşturuldu');
  } else {
    // Belirli bir tenant için
    const domain = await Prompts.askDomain();
    await setupRolesForTenant(domain);
    Logger.logComplete(`${domain} için roller oluşturuldu`);
  }
}

// Tenant için rol oluştur
async function setupRolesForTenant(domain: string) {
  Logger.logInfo(`${domain} için roller oluşturuluyor...`);
  
  // Tenant varlığını kontrol et
  if (!await DbUtils.tenantExists(domain)) {
    Logger.logError(`Tenant ${domain} bulunamadı`);
    return;
  }
  
  // Tenant türünü al
  const sysDataSource = await SchemaUtils.setupSchema('', DbUtils.SCHEMA_TYPES.SYS);
  
  if (!sysDataSource) {
    Logger.logError('Sistem şemasına bağlanılamadı');
    return;
  }
  
  // Tenant repository'si oluştur
  const tenantRepository = sysDataSource.getRepository('Tenant');
  
  // Tenant'ı al
  const tenant = await tenantRepository.findOne({
    where: { domain }
  });
  
  if (!tenant) {
    Logger.logError(`Tenant ${domain} bulunamadı`);
    await sysDataSource.destroy();
    return;
  }
  
  // Tenant türünü al
  const tenantType = tenant.tenantType;
  
  // Tenant şeması için DataSource oluştur
  const tenantDataSource = await SchemaUtils.setupSchema(domain, DbUtils.SCHEMA_TYPES.TENANT);
  
  if (!tenantDataSource) {
    Logger.logError(`Tenant şemasına bağlanılamadı: ${domain}`);
    await sysDataSource.destroy();
    return;
  }
  
  // Roller için repository oluştur
  const roleRepository = tenantDataSource.getRepository('Role');
  const permissionRepository = tenantDataSource.getRepository('Permission');
  
  // Tenant türüne göre rolleri oluştur
  // TODO: Rol ve izin tanımları eklenecek
  
  Logger.logSuccess(`${domain} için roller oluşturuldu`);
  
  await tenantDataSource.destroy();
  await sysDataSource.destroy();
}

// Programı çalıştır
if (require.main === module) {
  main().catch(error => {
    Logger.logError('Programda bir hata oluştu:', error);
    process.exit(1);
  });
}