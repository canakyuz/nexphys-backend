// src/shared/database/config/index.ts
export {
  PublicDataSource,
  initializePublicConnection,
  closePublicConnection
} from './public-connection';

export {
  createTenantDataSource,
  getTenantConnection,
  closeTenantConnection,
  closeAllTenantConnections
} from './tenant-connection';