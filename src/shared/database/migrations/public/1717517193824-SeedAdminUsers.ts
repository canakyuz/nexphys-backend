import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { TenantStatus } from '@/shared/database/entities/public/tenant.entity';

export class SeedAdminUsers1717517193824 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create superadmin user for main application (public schema)
    const passwordHash = await bcrypt.hash('superadmin123', 10);
    
    await queryRunner.query(`
      INSERT INTO "public"."users" (
        "id", "email", "password", "first_name", "last_name", "status", "role", "created_at", "updated_at"
      ) VALUES (
        '550e8400-e29b-41d4-a716-446655440999', 'superadmin@nexphys.com', '${passwordHash}', 'Super', 'Admin', 'ACTIVE', 'SUPERADMIN',
        NOW(), NOW()
      ) ON CONFLICT ("email") DO NOTHING;
    `);

    // Seed domain verification settings
    await queryRunner.query(`
      INSERT INTO "public"."settings" (
        "id", "key", "value", "created_at", "updated_at"
      ) VALUES (
        '550e8400-e29b-41d4-a716-446655440900', 'domain_verification', '{"enabled": true, "method": "DNS_TXT", "ttl": 3600}',
        NOW(), NOW()
      ) ON CONFLICT ("key") DO NOTHING;
    `);

    // Create demo tenants for development
    const tenantTypes = ['GYM', 'STUDIO', 'PERSONAL_TRAINER', 'ENTERPRISE'];
    const tenants = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'FitMax Gym',
        domain: 'fitmax-gym',
        tenantType: 'GYM',
        schemaName: 'tenant_fitmax_gym',
        adminEmail: 'admin@fitmax-gym.nexphys.com',
        adminPassword: 'admin123'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Zen Yoga Studio',
        domain: 'zen-yoga',
        tenantType: 'STUDIO',
        schemaName: 'tenant_zen_yoga',
        adminEmail: 'admin@zen-yoga.nexphys.com',
        adminPassword: 'admin123'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Elite Personal Training',
        domain: 'elite-pt',
        tenantType: 'PERSONAL_TRAINER',
        schemaName: 'tenant_elite_pt',
        adminEmail: 'admin@elite-pt.nexphys.com',
        adminPassword: 'admin123'
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        name: 'TechCorp Wellness',
        domain: 'techcorp-wellness',
        tenantType: 'ENTERPRISE',
        schemaName: 'tenant_techcorp_wellness',
        adminEmail: 'admin@techcorp-wellness.nexphys.com',
        adminPassword: 'admin123'
      }
    ];

    // Create tenants
    for (const tenant of tenants) {
      const now = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(now.getDate() + 30); // 30-day trial
      
      await queryRunner.query(`
        INSERT INTO "public"."tenants" (
          "id", "name", "domain", "tenantType", "schema_name", "status", "trialStartDate", "trialEndDate", 
          "isSchemaCreated", "createdAt", "updatedAt"
        ) VALUES (
          '${tenant.id}', '${tenant.name}', '${tenant.domain}', '${tenant.tenantType}', 
          '${tenant.schemaName}', '${TenantStatus.TRIAL}', NOW(), '${trialEndDate.toISOString()}', 
          false, NOW(), NOW()
        ) ON CONFLICT ("domain") DO NOTHING;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove demo tenants
    await queryRunner.query(`DELETE FROM "public"."tenants" WHERE "domain" IN (
      'fitmax-gym', 'zen-yoga', 'elite-pt', 'techcorp-wellness'
    )`);
    
    // Remove superadmin
    await queryRunner.query(`DELETE FROM "public"."users" WHERE "email" = 'superadmin@nexphys.com'`);
    
    // Remove settings
    await queryRunner.query(`DELETE FROM "public"."settings" WHERE "key" = 'domain_verification'`);
  }
}
