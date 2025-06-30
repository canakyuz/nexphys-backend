import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { TenantStatus } from '@/shared/database/entities/public/tenant.entity';
import { UserStatus } from '@/shared/database/entities/tenant/user.entity';

export class SeedTenantUsers1717517394824 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get tenant type from schema name for conditional seeding
    const schemaInfoResult = await queryRunner.query(`
      SELECT t.tenant_type 
      FROM public.tenants t 
      WHERE t.schema_name = current_schema()
    `);
    
    if (!schemaInfoResult || schemaInfoResult.length === 0) {
      // Could not determine tenant type for schema
      return;
    }
    
    const tenantType = schemaInfoResult[0].tenant_type;
    // Seeding users for tenant

    // Create admin user and associated role
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    
    // 1. First, find or create the appropriate admin role
    let adminRoleId;
    let adminRoleTypeId;
    
    // Get the appropriate role type ID based on tenant type
    switch (tenantType) {
      case 'GYM':
        adminRoleTypeId = await this.getRoleTypeIdByCode(queryRunner, 'GYM_OWNER');
        break;
      case 'STUDIO':
        adminRoleTypeId = await this.getRoleTypeIdByCode(queryRunner, 'STUDIO_OWNER');
        break;
      case 'PERSONAL_TRAINER':
        adminRoleTypeId = await this.getRoleTypeIdByCode(queryRunner, 'COACH');
        break;
      case 'ENTERPRISE':
        adminRoleTypeId = await this.getRoleTypeIdByCode(queryRunner, 'STUDIO_OWNER'); // Using Studio Owner role for Enterprise
        break;
      default:
        adminRoleTypeId = await this.getRoleTypeIdByCode(queryRunner, 'STUDIO_OWNER');
    }
    
    // Create admin role
    if (adminRoleTypeId) {
      const roleResult = await queryRunner.query(`
        INSERT INTO "roles" (
          "id", "name", "description", "is_active", "is_default", "role_type_id", "created_at", "updated_at"
        ) VALUES (
          'role-admin-001', 'Administrator', 'Full administrator access', true, false, '${adminRoleTypeId}',
          NOW(), NOW()
        ) ON CONFLICT ("name") DO UPDATE SET
          "role_type_id" = '${adminRoleTypeId}',
          "updated_at" = NOW()
        RETURNING "id"
      `);
      
      adminRoleId = roleResult[0].id;
    }
    
    // 2. Create admin user
    if (adminRoleId) {
      await queryRunner.query(`
        INSERT INTO "users" (
          "id", "email", "password", "first_name", "last_name", "status", "created_at", "updated_at"
        ) VALUES (
          'usr-admin-001', 'admin@nexphys.com', '${adminPasswordHash}', 'Admin', 'User', '${UserStatus.ACTIVE}',
          NOW(), NOW()
        ) ON CONFLICT ("email") DO UPDATE SET
          "updated_at" = NOW()
        RETURNING "id"
      `);
      
      // Assign admin role to user
      await queryRunner.query(`
        INSERT INTO "user_roles" (
          "id", "user_id", "role_id", "created_at", "updated_at"
        ) VALUES (
          'ur-admin-001', 'usr-admin-001', '${adminRoleId}', NOW(), NOW()
        ) ON CONFLICT ("user_id", "role_id") DO NOTHING
      `);
    }
    
    // Now seed additional role-specific users based on tenant type
    await this.seedTenantSpecificUsers(queryRunner, tenantType);
  }
  
  private async getRoleTypeIdByCode(queryRunner: QueryRunner, code: string): Promise<string | null> {
    const result = await queryRunner.query(`
      SELECT "id" FROM "role_types" WHERE "code" = '${code}' LIMIT 1
    `);
    
    return result && result.length > 0 ? result[0].id : null;
  }
  
  private async seedTenantSpecificUsers(queryRunner: QueryRunner, tenantType: string): Promise<void> {
    // Common password for all test users
    const passwordHash = await bcrypt.hash('password123', 10);
    
    // Helper function to create a user with a role
    const createUserWithRole = async (
      userId: string, 
      email: string, 
      firstName: string, 
      lastName: string, 
      roleTypeCode: string,
      roleName: string
    ) => {
      // Get role type ID
      const roleTypeId = await this.getRoleTypeIdByCode(queryRunner, roleTypeCode);
      if (!roleTypeId) return;
      
      // Create role if it doesn't exist
      const roleId = `role-${roleTypeCode.toLowerCase()}-001`;
      await queryRunner.query(`
        INSERT INTO "roles" (
          "id", "name", "description", "is_active", "is_default", "role_type_id", "created_at", "updated_at"
        ) VALUES (
          '${roleId}', '${roleName}', '${roleName} role', true, false, '${roleTypeId}',
          NOW(), NOW()
        ) ON CONFLICT ("name") DO NOTHING
        RETURNING "id"
      `);
      
      // Create user
      await queryRunner.query(`
        INSERT INTO "users" (
          "id", "email", "password", "first_name", "last_name", "status", "created_at", "updated_at"
        ) VALUES (
          '${userId}', '${email}', '${passwordHash}', '${firstName}', '${lastName}', '${UserStatus.ACTIVE}',
          NOW(), NOW()
        ) ON CONFLICT ("email") DO UPDATE SET
          "first_name" = '${firstName}',
          "last_name" = '${lastName}',
          "updated_at" = NOW()
        RETURNING "id"
      `);
      
      // Assign role to user
      const userRoleId = `ur-${userId}-${roleId}`;
      await queryRunner.query(`
        INSERT INTO "user_roles" (
          "id", "user_id", "role_id", "created_at", "updated_at"
        ) VALUES (
          '${userRoleId}', '${userId}', '${roleId}', NOW(), NOW()
        ) ON CONFLICT ("user_id", "role_id") DO NOTHING
      `);
    };
    
    // Create tenant-specific users
    switch (tenantType) {
      case 'GYM':
        // Owner
        await createUserWithRole(
          'usr-gym-owner-001',
          'owner@fitmax-gym.nexphys.com',
          'Jim',
          'Owner',
          'GYM_OWNER',
          'Gym Owner'
        );
        
        // Coach
        await createUserWithRole(
          'usr-gym-coach-001',
          'coach@fitmax-gym.nexphys.com',
          'Carl',
          'Coach',
          'GYM_COACH',
          'Gym Coach'
        );
        
        // Member
        await createUserWithRole(
          'usr-gym-member-001',
          'member@fitmax-gym.nexphys.com',
          'Mike',
          'Member',
          'GYM_MEMBER',
          'Gym Member'
        );
        break;
        
      case 'STUDIO':
        // Owner
        await createUserWithRole(
          'usr-studio-owner-001',
          'owner@zen-yoga.nexphys.com',
          'Zara',
          'Owner',
          'STUDIO_OWNER',
          'Studio Owner'
        );
        
        // Coach/Instructor
        await createUserWithRole(
          'usr-studio-coach-001',
          'instructor@zen-yoga.nexphys.com',
          'Irene',
          'Instructor',
          'STUDIO_COACH',
          'Studio Instructor'
        );
        
        // Member/Student
        await createUserWithRole(
          'usr-studio-member-001',
          'student@zen-yoga.nexphys.com',
          'Sam',
          'Student',
          'STUDIO_MEMBER',
          'Studio Student'
        );
        break;
        
      case 'PERSONAL_TRAINER':
        // Personal Trainer
        await createUserWithRole(
          'usr-pt-001',
          'coach@elite-pt.nexphys.com',
          'Peter',
          'Trainer',
          'COACH',
          'Personal Trainer'
        );
        
        // Client
        await createUserWithRole(
          'usr-pt-client-001',
          'client@elite-pt.nexphys.com',
          'Claire',
          'Client',
          'CLIENT',
          'PT Client'
        );
        break;
        
      case 'ENTERPRISE':
        // Admin
        await createUserWithRole(
          'usr-ent-admin-001',
          'wellness@techcorp.nexphys.com',
          'Wendy',
          'Admin',
          'STUDIO_OWNER',
          'Wellness Admin'
        );
        
        // Coach
        await createUserWithRole(
          'usr-ent-coach-001',
          'coach@techcorp.nexphys.com',
          'Craig',
          'Corporate',
          'STUDIO_COACH',
          'Corporate Coach'
        );
        
        // Employee
        await createUserWithRole(
          'usr-ent-emp-001',
          'employee@techcorp.nexphys.com',
          'Emma',
          'Employee',
          'STUDIO_MEMBER',
          'Employee Member'
        );
        break;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove all seeded users and their roles
    await queryRunner.query(`DELETE FROM "user_roles"`);
    await queryRunner.query(`DELETE FROM "users"`);
    await queryRunner.query(`DELETE FROM "roles" WHERE "name" IN (
      'Administrator', 'Gym Owner', 'Gym Coach', 'Gym Member',
      'Studio Owner', 'Studio Instructor', 'Studio Student',
      'Personal Trainer', 'PT Client', 'Wellness Admin',
      'Corporate Coach', 'Employee Member'
    )`);
  }
}
