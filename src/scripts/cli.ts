#!/usr/bin/env node
import 'reflect-metadata';
import { Command } from 'commander';
import { initializePublicConnection, closePublicConnection } from '@/shared/database/config';
import { logger } from '@/shared/utils/logger.util';

// Tenant komutları
import * as createTenant from './commands/tenant/create';
import * as removeTenant from './commands/tenant/remove';
import * as updateTenant from './commands/tenant/update';

// Şema komutları
import * as createSchema from './commands/schema/create';
import * as syncSchema from './commands/schema/sync';
import * as migrateSchema from './commands/schema/migrate';

// Seed komutları
import * as seedRoles from './commands/seed/roles';
import * as seedUsers from './commands/seed/users';
import * as seedTenants from './commands/seed/tenants';

// Test komutları
import * as testApi from './commands/test/api';
import * as testUsers from './commands/test/users';

// Kurulum komutları
import * as setupDev from './commands/setup/dev';
import * as setupProd from './commands/setup/prod';

const program = new Command();

program
  .name('nexphys-cli')
  .description('NexPhys Platform CLI')
  .version('1.0.0');

// Tenant komutları
program
  .command('tenant:create')
  .description('Create a new tenant')
  .option('-d, --domain <domain>', 'Tenant domain')
  .option('-n, --name <name>', 'Tenant name')
  .option('-t, --type <type>', 'Tenant type (GYM, STUDIO, PERSONAL_TRAINER, ENTERPRISE)')
  .option('-e, --email <email>', 'Admin email')
  .action(createTenant.execute);

program
  .command('tenant:remove')
  .description('Remove a tenant')
  .option('-d, --domain <domain>', 'Tenant domain')
  .option('--force', 'Force removal without confirmation')
  .action(removeTenant.execute);

program
  .command('tenant:update')
  .description('Update tenant properties')
  .option('-d, --domain <domain>', 'Tenant domain')
  .option('-n, --name <name>', 'New tenant name')
  .option('-s, --status <status>', 'New tenant status')
  .action(updateTenant.execute);

// Şema komutları
program
  .command('schema:create')
  .description('Create schemas for a tenant')
  .option('-d, --domain <domain>', 'Tenant domain')
  .option('--only <schemas>', 'Only create specific schemas (comma separated)')
  .action(createSchema.execute);

program
  .command('schema:sync')
  .description('Sync tenant schemas with database')
  .option('-d, --domain <domain>', 'Tenant domain')
  .option('--all', 'Sync all tenants')
  .action(syncSchema.execute);

program
  .command('schema:migrate')
  .description('Run migrations for schemas')
  .option('-d, --domain <domain>', 'Tenant domain')
  .option('-s, --schema <schema>', 'Schema name (sys, common, or tenant schema)')
  .option('--all', 'Run for all schemas')
  .option('--revert', 'Revert last migration')
  .action(migrateSchema.execute);

// Seed komutları
program
  .command('seed:roles')
  .description('Seed role types and permissions')
  .option('-d, --domain <domain>', 'Tenant domain')
  .option('--all', 'Seed for all tenants')
  .action(seedRoles.execute);

program
  .command('seed:users')
  .description('Seed test users')
  .option('-d, --domain <domain>', 'Tenant domain')
  .option('--admin', 'Create admin user')
  .option('--test', 'Create test users')
  .option('--all', 'Seed for all tenants')
  .action(seedUsers.execute);

program
  .command('seed:tenants')
  .description('Seed demo tenants')
  .option('--count <count>', 'Number of demo tenants to create')
  .option('--preset', 'Use preset demo tenants')
  .action(seedTenants.execute);

// Test komutları
program
  .command('test:api')
  .description('Run API tests')
  .option('-d, --domain <domain>', 'Tenant domain for testing')
  .option('--all', 'Test all API endpoints')
  .option('--module <module>', 'Test specific module')
  .action(testApi.execute);

program
  .command('test:users')
  .description('Test user module functionality')
  .option('-d, --domain <domain>', 'Tenant domain for testing')
  .action(testUsers.execute);

// Kurulum komutları
program
  .command('setup:dev')
  .description('Setup development environment')
  .option('--clean', 'Clean install (drop existing schemas)')
  .option('--seed', 'Include seed data')
  .action(setupDev.execute);

program
  .command('setup:prod')
  .description('Setup production environment')
  .option('--clean', 'Clean install (drop existing schemas)')
  .action(setupProd.execute);

// Graceful exit
const exitHandler = async () => {
  try {
    await closePublicConnection();
    logger.info('✅ Database connections closed');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during exit:', error);
    process.exit(1);
  }
};

process.on('SIGINT', exitHandler);
process.on('SIGTERM', exitHandler);

// Run the program
(async () => {
  try {
    await initializePublicConnection();
    program.parse(process.argv);
  } catch (error) {
    logger.error('❌ Error initializing CLI:', error);
    process.exit(1);
  }
})(); 