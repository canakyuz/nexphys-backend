// src/shared/utils/route.util.ts
import { envConfig } from '@/config/env.config';

/**
 * Route yardımcı sınıfı
 * Tüm API rotaları için tutarlı bir şekilde prefix kullanımını sağlar
 */
export class RouteUtil {
  /**
   * Ana API prefix'ini döndürür
   * @returns {string} API prefix (/api/v1)
   */
  static getApiPrefix(): string {
    return envConfig.API_PREFIX;
  }

  /**
   * Belirli bir modül için API yolunu oluşturur
   * @param {string} moduleName - Modül adı (auth, users, tenants, vb.)
   * @returns {string} Modül için tam API yolu (/api/v1/[moduleName])
   */
  static getModuleRoute(moduleName: string): string {
    return `${this.getApiPrefix()}/${moduleName}`;
  }

  /**
   * Belirli bir endpoint için tam API yolunu oluşturur
   * @param {string} moduleName - Modül adı (auth, users, tenants, vb.)
   * @param {string} endpoint - Endpoint adı (register, login, profile, vb.)
   * @returns {string} Endpoint için tam API yolu (/api/v1/[moduleName]/[endpoint])
   */
  static getEndpointRoute(moduleName: string, endpoint: string): string {
    return `${this.getModuleRoute(moduleName)}/${endpoint}`;
  }
}
