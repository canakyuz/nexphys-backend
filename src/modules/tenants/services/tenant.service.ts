import { Repository, DataSource } from 'typeorm';
import { PublicDataSource } from '@/shared/database/config/public-connection';
import { createTenantDataSource } from '@/shared/database/config/tenant-connection';
import { Tenant, TenantStatus } from '@/shared/database/entities/public/tenant.entity';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { AppError } from '@/shared/middlewares/error.middleware';
import { envConfig } from '@/config/env.config';
import { logger } from '@/shared/utils/logger.util';

export class TenantService {
  private tenantRepository: Repository<Tenant>;

  constructor() {
    this.tenantRepository = PublicDataSource.getRepository(Tenant);
  }

  async createTenant(createTenantDto: CreateTenantDto): Promise<Tenant> {
    // Check if domain already exists
    const existingTenant = await this.tenantRepository.findOne({
      where: { domain: createTenantDto.domain }
    });

    if (existingTenant) {
      throw new AppError('Domain already exists', 409);
    }

    // Create tenant
    const tenant = this.tenantRepository.create({
      ...createTenantDto,
      status: TenantStatus.TRIAL,
      trialStartDate: new Date(),
      trialEndDate: new Date(Date.now() + envConfig.TENANT_TRIAL_DAYS * 24 * 60 * 60 * 1000),
    });

    await this.tenantRepository.save(tenant);

    // Create tenant schema
    if (envConfig.AUTO_CREATE_TENANT_SCHEMA) {
      await this.createTenantSchema(tenant);
    }

    logger.info(`Tenant created: ${tenant.domain} (${tenant.schemaName})`);
    return tenant;
  }

  async getTenants(page: number = 1, limit: number = 20): Promise<{ data: Tenant[], total: number }> {
    const [data, total] = await this.tenantRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' }
    });

    return { data, total };
  }

  async getTenantById(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
      relations: ['subscriptions']
    });

    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    return tenant;
  }

  async getTenantByDomain(domain: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { domain }
    });

    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }

    return tenant;
  }

  async updateTenant(id: string, updateData: Partial<CreateTenantDto>): Promise<Tenant> {
    const tenant = await this.getTenantById(id);

    Object.assign(tenant, updateData);
    await this.tenantRepository.save(tenant);

    return tenant;
  }

  async deleteTenant(id: string): Promise<void> {
    const tenant = await this.getTenantById(id);

    // Drop tenant schema
    await this.dropTenantSchema(tenant.schemaName);

    // Delete tenant
    await this.tenantRepository.remove(tenant);

    logger.info(`Tenant deleted: ${tenant.domain}`);
  }

  private async createTenantSchema(tenant: Tenant): Promise<void> {
    try {
      const queryRunner = PublicDataSource.createQueryRunner();

      // Create schema
      await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "${tenant.schemaName}"`);

      // Create tenant-specific data source
      const tenantDataSource = createTenantDataSource(tenant.schemaName);
      await tenantDataSource.initialize();

      // Run migrations
      await tenantDataSource.runMigrations();

      // Seed initial data
      await this.seedTenantData(tenantDataSource);

      // Update tenant status
      tenant.isSchemaCreated = true;
      await this.tenantRepository.save(tenant);

      await tenantDataSource.destroy();
      await queryRunner.release();

      logger.info(`Schema created for tenant: ${tenant.schemaName}`);
    } catch (error) {
      logger.error(`Failed to create schema for tenant ${tenant.domain}:`, error);
      throw new AppError('Failed to create tenant schema', 500);
    }
  }

  private async dropTenantSchema(schemaName: string): Promise<void> {
    try {
      const queryRunner = PublicDataSource.createQueryRunner();
      await queryRunner.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
      await queryRunner.release();

      logger.info(`Schema dropped: ${schemaName}`);
    } catch (error) {
      logger.error(`Failed to drop schema ${schemaName}:`, error);
      throw new AppError('Failed to drop tenant schema', 500);
    }
  }

  private async seedTenantData(tenantDataSource: DataSource): Promise<void> {
    // Bu kısımda tenant için initial data oluşturulacak
    // Role types, permissions, default roles, etc.
    logger.info('Seeding tenant data...');
  }
}