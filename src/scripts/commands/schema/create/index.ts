import * as Logger from '../../../utils/logger';
import * as Prompts from '../../../utils/prompts';
import * as DbUtils from '../../../utils/db';
import * as SchemaUtils from '../../../utils/schema';

interface SchemaCreateOptions {
  domain?: string;
  only?: string;
}

/**
 * Şema oluşturma komutu
 * Tenant için belirtilen şemaları oluşturur
 */
export const execute = async (options: SchemaCreateOptions): Promise<void> => {
  try {
    Logger.logHeader('NexPhys Schema Creation');
    
    // Domain bilgisini al
    const domain = options.domain || await Prompts.askDomain();
    
    // Tenant varlığını kontrol et
    if (!await DbUtils.tenantExists(domain)) {
      Logger.logError(`Tenant with domain '${domain}' does not exist`);
      return;
    }
    
    // Oluşturulacak şema tiplerini belirle
    let schemaTypes: string[] = [];
    
    if (options.only) {
      // Belirli şemaları oluştur
      const requestedTypes = options.only.split(',').map(type => type.trim().toLowerCase());
      
      for (const requestedType of requestedTypes) {
        if (Object.values(DbUtils.SCHEMA_TYPES).includes(requestedType)) {
          schemaTypes.push(requestedType);
        } else {
          Logger.logWarning(`Invalid schema type: ${requestedType}`);
        }
      }
      
      if (schemaTypes.length === 0) {
        Logger.logError('No valid schema types specified');
        return;
      }
    } else {
      // Default olarak tenant şemasını oluştur
      schemaTypes = [DbUtils.SCHEMA_TYPES.TENANT];
      
      // Eğer sys ve common şemaları istenirse onları da ekle
      const includeSysSchema = await Prompts.askConfirmation('Include sys schema?');
      if (includeSysSchema) {
        schemaTypes.push(DbUtils.SCHEMA_TYPES.SYS);
      }
      
      const includeCommonSchema = await Prompts.askConfirmation('Include common schema?');
      if (includeCommonSchema) {
        schemaTypes.push(DbUtils.SCHEMA_TYPES.COMMON);
      }
    }
    
    // Şemaları oluştur
    Logger.logStart('Creating schemas');
    
    for (const schemaType of schemaTypes) {
      Logger.logInfo(`Creating ${schemaType} schema`);
      
      // Şema adını oluştur
      const schemaName = DbUtils.createSchemaName(domain, schemaType);
      
      // Şema var mı kontrol et
      const exists = await DbUtils.schemaExists(schemaName);
      
      if (exists) {
        Logger.logWarning(`Schema already exists: ${schemaName}`);
        
        // Şemayı sil ve yeniden oluşturmak isteyip istemediğini sor
        const recreate = await Prompts.askConfirmation('Do you want to drop and recreate this schema?');
        
        if (recreate) {
          // Şemayı sil
          const dropped = await DbUtils.dropSchema(schemaName);
          
          if (!dropped) {
            Logger.logError(`Failed to drop schema: ${schemaName}`);
            continue;
          }
          
          Logger.logSuccess(`Dropped schema: ${schemaName}`);
        } else {
          Logger.logInfo(`Skipping schema: ${schemaName}`);
          continue;
        }
      }
      
      // Şemayı oluştur
      const created = await DbUtils.createSchema(schemaName);
      
      if (!created) {
        Logger.logError(`Failed to create schema: ${schemaName}`);
        continue;
      }
      
      Logger.logSuccess(`Created schema: ${schemaName}`);
    }
    
    // Migration'ları çalıştırmak ister misin?
    const runMigrations = await Prompts.askConfirmation('Do you want to run migrations for the created schemas?');
    
    if (runMigrations) {
      Logger.logStart('Running migrations');
      
      for (const schemaType of schemaTypes) {
        Logger.logInfo(`Running migrations for ${schemaType} schema`);
        
        const dataSource = await SchemaUtils.setupSchema(domain, schemaType);
        
        if (!dataSource) {
          Logger.logError(`Failed to setup ${schemaType} schema`);
          continue;
        }
        
        const success = await SchemaUtils.runMigrations(dataSource);
        
        if (success) {
          Logger.logSuccess(`Migrations for ${schemaType} schema completed`);
        } else {
          Logger.logError(`Failed to run migrations for ${schemaType} schema`);
        }
        
        await dataSource.destroy();
      }
    }
    
    Logger.logComplete('Schema creation');
    
  } catch (error) {
    Logger.logError('Error creating schemas', error);
  }
}; 