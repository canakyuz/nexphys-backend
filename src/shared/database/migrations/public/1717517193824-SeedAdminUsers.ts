import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { TenantStatus } from '@/shared/database/entities/public/tenant.entity';

export class SeedAdminUsers1717517193824 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create superadmin user for main application (public schema)
    const passwordHash = await bcrypt.hash('superadmin123', 10);
    
    await queryRunner.query(`
      INSERT INTO "public"."users" (
        "id", "email", "password", "first_name", "last_name", "status", "role", "created_at", "updated_at"
      ) VALUES (
        'sup-admin-001', 'superadmin@nexphys.com', '${passwordHash}', 'Super', 'Admin', 'ACTIVE', 'SUPERADMIN',
        NOW(), NOW()
      ) ON CONFLICT ("email") DO NOTHING;
    `);

    // Seed domain verification settings
    await queryRunner.query(`
      INSERT INTO "public"."settings" (
        "id", "key", "value", "created_at", "updated_at"
      ) VALUES (
        'setting-dns-001', 'domain_verification', '{"enabled": true, "method": "DNS_TXT", "ttl": 3600}',
        NOW(), NOW()
      ) ON CONFLICT ("key") DO NOTHING;
    `);

    // Create demo tenants for development
    const tenantTypes = ['GYM', 'STUDIO', 'PERSONAL_TRAINER', 'ENTERPRISE'];
    const tenants = [
      {
        id: 'tenant-gym-001',
        name: 'FitMax Gym',
        domain: 'fitmax-gym',
        tenant_type: 'GYM',
        schema_name: 'tenant_fitmax_gym',
        admin_email: 'admin@fitmax-gym.nexphys.com',
        admin_password: 'admin123'
      },
      {
        id: 'tenant-studio-001',
        name: 'Zen Yoga Studio',
        domain: 'zen-yoga',
        tenant_type: 'STUDIO',
        schema_name: 'tenant_zen_yoga',
        admin_email: 'admin@zen-yoga.nexphys.com',
        admin_password: 'admin123'
      },
      {
        id: 'tenant-pt-001',
        name: 'Elite Personal Training',
        domain: 'elite-pt',
        tenant_type: 'PERSONAL_TRAINER',
        schema_name: 'tenant_elite_pt',
        admin_email: 'admin@elite-pt.nexphys.com',
        admin_password: 'admin123'
      },
      {
        id: 'tenant-ent-001',
        name: 'TechCorp Wellness',
        domain: 'techcorp-wellness',
        tenant_type: 'ENTERPRISE',
        schema_name: 'tenant_techcorp_wellness',
        admin_email: 'admin@techcorp-wellness.nexphys.com',
        admin_password: 'admin123'
      }
    ];

    // Create tenants
    for (const tenant of tenants) {
      const now = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(now.getDate() + 30); // 30-day trial
      
      await queryRunner.query(`
        INSERT INTO "public"."tenants" (
          "id", "name", "domain", "tenant_type", "schema_name", "status", "trial_start_date", "trial_end_date", 
          "is_schema_created", "created_at", "updated_at"
        ) VALUES (
          '${tenant.id}', '${tenant.name}', '${tenant.domain}', '${tenant.tenant_type}', 
          '${tenant.schema_name}', '${TenantStatus.TRIAL}', NOW(), '${trialEndDate.toISOString()}', 
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
