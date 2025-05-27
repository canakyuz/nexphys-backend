import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { TenantStatus } from '@/shared/database/entities/public/tenant.entity';

export class SeedTestUsers1717600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Common password for all test users
    const testPassword = 'Test123!';
    const passwordHash = await bcrypt.hash(testPassword, 10);

    // Test users for each tenant
    const tenants = [
      {
        schema_name: 'tenant_fitmax_gym',
        users: [
          { id: 'user-gym-001', email: 'manager@fitmax.test', firstName: 'Gym', lastName: 'Manager', role: 'MANAGER' },
          { id: 'user-gym-002', email: 'trainer1@fitmax.test', firstName: 'Alex', lastName: 'Trainer', role: 'TRAINER' },
          { id: 'user-gym-003', email: 'trainer2@fitmax.test', firstName: 'Sam', lastName: 'Smith', role: 'TRAINER' },
          { id: 'user-gym-004', email: 'member1@fitmax.test', firstName: 'John', lastName: 'Member', role: 'MEMBER' },
          { id: 'user-gym-005', email: 'member2@fitmax.test', firstName: 'Jane', lastName: 'Doe', role: 'MEMBER' }
        ]
      },
      {
        schema_name: 'tenant_zen_yoga',
        users: [
          { id: 'user-yoga-001', email: 'manager@zen.test', firstName: 'Yoga', lastName: 'Manager', role: 'MANAGER' },
          { id: 'user-yoga-002', email: 'instructor1@zen.test', firstName: 'Maya', lastName: 'Yoga', role: 'INSTRUCTOR' },
          { id: 'user-yoga-003', email: 'member1@zen.test', firstName: 'Zack', lastName: 'Zen', role: 'MEMBER' }
        ]
      },
      {
        schema_name: 'tenant_elite_pt',
        users: [
          { id: 'user-pt-001', email: 'trainer1@elite.test', firstName: 'Elite', lastName: 'Trainer', role: 'TRAINER' },
          { id: 'user-pt-002', email: 'client1@elite.test', firstName: 'Client', lastName: 'One', role: 'CLIENT' },
          { id: 'user-pt-003', email: 'client2@elite.test', firstName: 'Client', lastName: 'Two', role: 'CLIENT' }
        ]
      },
      {
        schema_name: 'tenant_techcorp_wellness',
        users: [
          { id: 'user-tc-001', email: 'admin@techcorp.test', firstName: 'Corp', lastName: 'Admin', role: 'ADMIN' },
          { id: 'user-tc-002', email: 'manager@techcorp.test', firstName: 'Wellness', lastName: 'Manager', role: 'MANAGER' },
          { id: 'user-tc-003', email: 'employee1@techcorp.test', firstName: 'Emma', lastName: 'Employee', role: 'EMPLOYEE' },
          { id: 'user-tc-004', email: 'employee2@techcorp.test', firstName: 'Tom', lastName: 'Worker', role: 'EMPLOYEE' }
        ]
      }
    ];

    // Insert users into each tenant schema
    for (const tenant of tenants) {
      for (const user of tenant.users) {
        await queryRunner.query(`
          INSERT INTO "${tenant.schema_name}"."users" (
            "id", "email", "password", "first_name", "last_name", "status", "role", "created_at", "updated_at"
          ) VALUES (
            '${user.id}', '${user.email}', '${passwordHash}', '${user.firstName}', '${user.lastName}', 
            'ACTIVE', '${user.role}', NOW(), NOW()
          ) ON CONFLICT ("email") DO NOTHING;
        `);
      }
    }

    // Create some public test users for development
    const publicUsers = [
      { id: 'test-admin-001', email: 'testadmin@nexphys.test', firstName: 'Test', lastName: 'Admin', role: 'ADMIN' },
      { id: 'test-user-001', email: 'testuser@nexphys.test', firstName: 'Test', lastName: 'User', role: 'USER' }
    ];

    for (const user of publicUsers) {
      await queryRunner.query(`
        INSERT INTO "public"."users" (
          "id", "email", "password", "first_name", "last_name", "status", "role", "created_at", "updated_at"
        ) VALUES (
          '${user.id}', '${user.email}', '${passwordHash}', '${user.firstName}', '${user.lastName}', 
          'ACTIVE', '${user.role}', NOW(), NOW()
        ) ON CONFLICT ("email") DO NOTHING;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove test users from each tenant schema
    const schemas = [
      'tenant_fitmax_gym',
      'tenant_zen_yoga',
      'tenant_elite_pt',
      'tenant_techcorp_wellness'
    ];

    for (const schema of schemas) {
      await queryRunner.query(`
        DELETE FROM "${schema}"."users" WHERE "email" LIKE '%@fitmax.test' OR 
        "email" LIKE '%@zen.test' OR "email" LIKE '%@elite.test' OR "email" LIKE '%@techcorp.test';
      `);
    }

    // Remove public test users
    await queryRunner.query(`
      DELETE FROM "public"."users" WHERE "email" LIKE '%@nexphys.test';
    `);
  }
}
