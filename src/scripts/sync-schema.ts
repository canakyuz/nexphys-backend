import { PublicDataSource } from '../shared/database/config/public-connection';

async function syncPublicSchema() {
  try {
    console.log('Initializing public data source...');
    await PublicDataSource.initialize();
    console.log('Public data source initialized successfully!');
    
    console.log('Synchronizing public schema...');
    await PublicDataSource.synchronize();
    console.log('Public schema synchronized successfully!');
    
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

syncPublicSchema();
