import { PublicDataSource } from '../shared/database/config/public-connection';

async function createSettingsTable() {
  try {
    console.log('Initializing public data source...');
    await PublicDataSource.initialize();
    console.log('Public data source initialized successfully!');
    
    console.log('Creating settings table in public schema...');
    await PublicDataSource.query(`
      CREATE TABLE IF NOT EXISTS "public"."settings" (
        "id" VARCHAR(36) NOT NULL,
        "key" VARCHAR(255) NOT NULL UNIQUE,
        "value" JSONB NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY ("id")
      )
    `);
    console.log('Settings table created successfully!');
    
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

createSettingsTable();
