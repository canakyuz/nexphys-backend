import { MigrationInterface, QueryRunner } from 'typeorm';
import { RoleCategory, RoleLevel, RoleTypeCode } from '@/shared/database/entities/tenant/role-type.entity';

export class SeedRoleTypes1717517293824 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Seed role types for all tenant types
    // These roles will be available in all tenant schemas
    const roleTypes = [
      // System Roles
      {
        id: 'roletype-001',
        name: 'System Administrator',
        code: RoleTypeCode.STUDIO_OWNER,
        description: 'Full system administrator with all permissions',
        level: RoleLevel.ADMIN,
        category: RoleCategory.SYSTEM,
      },
      {
        id: 'roletype-002',
        name: 'System Manager',
        code: RoleTypeCode.STUDIO_COACH,
        description: 'System manager with management permissions',
        level: RoleLevel.MANAGER,
        category: RoleCategory.SYSTEM,
      },
      
      // Client Roles
      {
        id: 'roletype-101',
        name: 'Client',
        code: RoleTypeCode.CLIENT,
        description: 'Basic client account',
        level: RoleLevel.BASIC,
        category: RoleCategory.CLIENT,
      },
      
      // Coach Roles
      {
        id: 'roletype-201',
        name: 'Personal Trainer',
        code: RoleTypeCode.COACH,
        description: 'Personal trainer with client management',
        level: RoleLevel.PREMIUM,
        category: RoleCategory.COACH,
      },
      {
        id: 'roletype-202',
        name: 'Coach-Member',
        code: RoleTypeCode.COACH_MEMBER,
        description: 'Personal trainer who is also a member',
        level: RoleLevel.BASIC,
        category: RoleCategory.COACH,
      },
      
      // Studio Roles
      {
        id: 'roletype-301',
        name: 'Studio Owner',
        code: RoleTypeCode.STUDIO_OWNER,
        description: 'Studio owner with full business control',
        level: RoleLevel.OWNER,
        category: RoleCategory.STUDIO,
      },
      {
        id: 'roletype-302',
        name: 'Studio Coach',
        code: RoleTypeCode.STUDIO_COACH,
        description: 'Studio instructor or coach',
        level: RoleLevel.PREMIUM,
        category: RoleCategory.STUDIO,
      },
      {
        id: 'roletype-303',
        name: 'Studio Member',
        code: RoleTypeCode.STUDIO_MEMBER,
        description: 'Studio member/client',
        level: RoleLevel.BASIC,
        category: RoleCategory.STUDIO,
      },
      
      // Gym Roles
      {
        id: 'roletype-401',
        name: 'Gym Owner',
        code: RoleTypeCode.GYM_OWNER,
        description: 'Gym owner with full business control',
        level: RoleLevel.OWNER,
        category: RoleCategory.GYM,
      },
      {
        id: 'roletype-402',
        name: 'Gym Coach',
        code: RoleTypeCode.GYM_COACH,
        description: 'Gym trainer or coach',
        level: RoleLevel.PREMIUM,
        category: RoleCategory.GYM,
      },
      {
        id: 'roletype-403',
        name: 'Gym Member',
        code: RoleTypeCode.GYM_MEMBER,
        description: 'Gym member/client',
        level: RoleLevel.BASIC,
        category: RoleCategory.GYM,
      },
    ];

    // Insert role types
    for (const roleType of roleTypes) {
      await queryRunner.query(`
        INSERT INTO "role_types" (
          "id", "name", "code", "description", "level", "category", "is_active", "created_at", "updated_at"
        ) VALUES (
          '${roleType.id}', '${roleType.name}', '${roleType.code}', '${roleType.description}',
          '${roleType.level}', '${roleType.category}', true, NOW(), NOW()
        ) ON CONFLICT ("code") DO NOTHING;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove all seeded role types
    await queryRunner.query(`DELETE FROM "role_types"`);
  }
}
