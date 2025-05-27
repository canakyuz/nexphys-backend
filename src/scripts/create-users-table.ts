import { PublicDataSource } from '../shared/database/config/public-connection';

async function createUsersTable() {
  try {
    console.log('Initializing public data source...');
    await PublicDataSource.initialize();
    console.log('Public data source initialized successfully!');
    
    console.log('Creating users table in public schema...');
    await PublicDataSource.query(`
      CREATE TABLE IF NOT EXISTS "public"."users" (
        "id" VARCHAR(36) NOT NULL,
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password" VARCHAR(255) NOT NULL,
        "first_name" VARCHAR(100) NOT NULL,
        "last_name" VARCHAR(100) NOT NULL,
        "status" VARCHAR(50) NOT NULL,
        "role" VARCHAR(50) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      )
    `);
    console.log('Users table created successfully!');
    
    console.log('Closing connection...');
    await PublicDataSource.destroy();
    console.log('Connection closed.');
  } catch (error) {
    console.error('Error:', error);
    if (PublicDataSource.isInitialized) {
      await PublicDataSource.destroy();
    }
  }
}

createUsersTable();
