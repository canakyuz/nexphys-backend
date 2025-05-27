import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Import the migration directly
import { SeedTestUsers1717600000000 } from '../src/shared/database/migrations/public/1717600000000-SeedTestUsers';

/**
 * Helper script to run the SeedTestUsers migration directly
 */
async function runTestUsersMigration() {
  // Create a connection to public schema
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'nexphys_user',
    password: process.env.DB_PASSWORD || 'nexphys_password',
    database: process.env.DB_DATABASE || 'nexphys_db',
    schema: 'public',
    synchronize: false,
    logging: true,
  });

  try {
    // Initialize the connection
    await dataSource.initialize();
    console.log('Database connection established');

    // Create migration instance
    const migration = new SeedTestUsers1717600000000();
    
    // Run the migration
    console.log('Running test users seed migration...');
    await migration.up(dataSource.createQueryRunner());
    
    console.log('Migration completed successfully!');
    console.log('\nTest users have been created with password: Test123!');
    console.log('\nAvailable test users:');
    console.log('- testadmin@nexphys.test (ADMIN)');
    console.log('- testuser@nexphys.test (USER)');
    console.log('- manager@fitmax.test (MANAGER)');
    console.log('- trainer1@fitmax.test (TRAINER)');
    console.log('- member1@fitmax.test (MEMBER)');
    console.log('- manager@zen.test (MANAGER)');
    console.log('- instructor1@zen.test (INSTRUCTOR)');
    console.log('- trainer1@elite.test (TRAINER)');
    console.log('- client1@elite.test (CLIENT)');
    console.log('- admin@techcorp.test (ADMIN)');
    console.log('- employee1@techcorp.test (EMPLOYEE)');
    console.log('(and more)');
    
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    // Close the connection
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Database connection closed');
    }
  }
}

// Run the script
runTestUsersMigration();
