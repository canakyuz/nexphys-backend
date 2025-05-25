// src/shared/database/seeds/tenant/tenant-type-specific-seed.ts
import { DataSource } from 'typeorm';
import { createTenantDataSource } from '../../config/tenant-connection';
import { RoleType, RoleTypeCode, RoleLevel, RoleCategory } from '../../entities/tenant/role-type.entity';
import { Permission, PermissionAction } from '../../entities/tenant/permission.entity';
import { Role } from '../../entities/tenant/role.entity';
import { User, UserStatus } from '../../entities/tenant/user.entity';
import { TenantType } from '../../entities/public/tenant.entity';
import { logger } from '@/shared/utils/logger.util';

// Role type configurations for different tenant types
const TENANT_ROLE_CONFIGS = {
  [TenantType.GYM]: {
    roleTypes: [
      { name: 'Gym Owner', code: RoleTypeCode.GYM_OWNER, level: RoleLevel.OWNER, category: RoleCategory.GYM },
      { name: 'Gym Manager', code: RoleTypeCode.GYM_MEMBER, level: RoleLevel.MANAGER, category: RoleCategory.GYM },
      { name: 'Personal Trainer', code: RoleTypeCode.COACH, level: RoleLevel.PREMIUM, category: RoleCategory.COACH },
      { name: 'Gym Member', code: RoleTypeCode.CLIENT, level: RoleLevel.BASIC, category: RoleCategory.CLIENT }
    ],
    permissions: [
      // Gym-specific permissions
      { name: 'Manage Equipment', resource: 'equipment', action: PermissionAction.MANAGE },
      { name: 'View Equipment', resource: 'equipment', action: PermissionAction.READ },
      { name: 'Manage Memberships', resource: 'memberships', action: PermissionAction.MANAGE },
      { name: 'View Members', resource: 'members', action: PermissionAction.READ },
      { name: 'Manage Classes', resource: 'classes', action: PermissionAction.MANAGE },
      { name: 'Book Classes', resource: 'classes', action: PermissionAction.CREATE },
      { name: 'View Analytics', resource: 'analytics', action: PermissionAction.READ },
      { name: 'Manage Locker Rentals', resource: 'lockers', action: PermissionAction.MANAGE }
    ],
    defaultUsers: [
      { firstName: 'Mike', lastName: 'Johnson', email: 'owner@fitmax-gym.com', roleCode: RoleTypeCode.GYM_OWNER },
      { firstName: 'Sarah', lastName: 'Wilson', email: 'trainer@fitmax-gym.com', roleCode: RoleTypeCode.COACH },
      { firstName: 'John', lastName: 'Doe', email: 'member@fitmax-gym.com', roleCode: RoleTypeCode.CLIENT }
    ]
  },

  [TenantType.STUDIO]: {
    roleTypes: [
      { name: 'Studio Owner', code: RoleTypeCode.STUDIO_OWNER, level: RoleLevel.OWNER, category: RoleCategory.STUDIO },
      { name: 'Yoga Instructor', code: RoleTypeCode.STUDIO_COACH, level: RoleLevel.PREMIUM, category: RoleCategory.COACH },
      { name: 'Studio Member', code: RoleTypeCode.STUDIO_MEMBER, level: RoleLevel.BASIC, category: RoleCategory.CLIENT }
    ],
    permissions: [
      // Studio-specific permissions
      { name: 'Manage Classes', resource: 'classes', action: PermissionAction.MANAGE },
      { name: 'Teach Classes', resource: 'classes', action: PermissionAction.UPDATE },
      { name: 'Book Classes', resource: 'classes', action: PermissionAction.CREATE },
      { name: 'View Class Schedule', resource: 'classes', action: PermissionAction.READ },
      { name: 'Manage Meditation Sessions', resource: 'meditation', action: PermissionAction.MANAGE },
      { name: 'Track Wellness', resource: 'wellness', action: PermissionAction.CREATE },
      { name: 'View Community Events', resource: 'events', action: PermissionAction.READ }
    ],
    defaultUsers: [
      { firstName: 'Maya', lastName: 'Patel', email: 'namaste@zen-yoga.com', roleCode: RoleTypeCode.STUDIO_OWNER },
      { firstName: 'Luna', lastName: 'Chen', email: 'instructor@zen-yoga.com', roleCode: RoleTypeCode.STUDIO_COACH },
      { firstName: 'Alex', lastName: 'Smith', email: 'student@zen-yoga.com', roleCode: RoleTypeCode.STUDIO_MEMBER }
    ]
  },

  [TenantType.PERSONAL_TRAINER]: {
    roleTypes: [
      { name: 'Personal Trainer', code: RoleTypeCode.COACH, level: RoleLevel.OWNER, category: RoleCategory.COACH },
      { name: 'Client', code: RoleTypeCode.CLIENT, level: RoleLevel.BASIC, category: RoleCategory.CLIENT }
    ],
    permissions: [
      // Personal trainer specific permissions
      { name: 'Manage Clients', resource: 'clients', action: PermissionAction.MANAGE },
      { name: 'Create Workout Programs', resource: 'workouts', action: PermissionAction.MANAGE },
      { name: 'Track Client Progress', resource: 'progress', action: PermissionAction.MANAGE },
      { name: 'Nutrition Coaching', resource: 'nutrition', action: PermissionAction.MANAGE },
      { name: 'Schedule Sessions', resource: 'sessions', action: PermissionAction.MANAGE },
      { name: 'View Own Progress', resource: 'progress', action: PermissionAction.READ },
      { name: 'Book Sessions', resource: 'sessions', action: PermissionAction.CREATE }
    ],
    defaultUsers: [
      { firstName: 'Marcus', lastName: 'Rodriguez', email: 'coach@elite-pt.com', roleCode: RoleTypeCode.COACH },
      { firstName: 'Emma', lastName: 'Davis', email: 'client1@elite-pt.com', roleCode: RoleTypeCode.CLIENT }
    ]
  },

  [TenantType.ENTERPRISE]: {
    roleTypes: [
      { name: 'Wellness Administrator', code: RoleTypeCode.GYM_OWNER, level: RoleLevel.OWNER, category: RoleCategory.SYSTEM },
      { name: 'Wellness Coach', code: RoleTypeCode.COACH, level: RoleLevel.PREMIUM, category: RoleCategory.COACH },
      { name: 'Employee', code: RoleTypeCode.CLIENT, level: RoleLevel.BASIC, category: RoleCategory.CLIENT }
    ],
    permissions: [
      // Enterprise-specific permissions
      { name: 'Manage Employee Wellness', resource: 'employee_wellness', action: PermissionAction.MANAGE },
      { name: 'Create Health Challenges', resource: 'challenges', action: PermissionAction.MANAGE },
      { name: 'View Wellness Analytics', resource: 'analytics', action: PermissionAction.READ },
      { name: 'Manage Team Competitions', resource: 'competitions', action: PermissionAction.MANAGE },
      { name: 'Participate in Challenges', resource: 'challenges', action: PermissionAction.CREATE },
      { name: 'View Team Stats', resource: 'team_stats', action: PermissionAction.READ },
      { name: 'Track Personal Wellness', resource: 'personal_wellness', action: PermissionAction.CREATE }
    ],
    defaultUsers: [
      { firstName: 'Jessica', lastName: 'Kim', email: 'wellness@techcorp.com', roleCode: RoleTypeCode.GYM_OWNER },
      { firstName: 'David', lastName: 'Brown', email: 'coach@techcorp.com', roleCode: RoleTypeCode.COACH },
      { firstName: 'Lisa', lastName: 'Wang', email: 'employee@techcorp.com', roleCode: RoleTypeCode.CLIENT }
    ]
  }
};

export async function seedTenantSpecificData(tenantType: TenantType, schemaName: string) {
  try {
    logger.info(`🌱 Seeding ${tenantType} specific data for schema: ${schemaName}`);

    const tenantDataSource = createTenantDataSource(schemaName);
    await tenantDataSource.initialize();

    const config = TENANT_ROLE_CONFIGS[tenantType];
    if (!config) {
      throw new Error(`No configuration found for tenant type: ${tenantType}`);
    }

    const roleTypeRepository = tenantDataSource.getRepository(RoleType);
    const permissionRepository = tenantDataSource.getRepository(Permission);
    const roleRepository = tenantDataSource.getRepository(Role);
    const userRepository = tenantDataSource.getRepository(User);

    // Create role types
    const createdRoleTypes = [];
    for (const roleTypeData of config.roleTypes) {
      const existing = await roleTypeRepository.findOne({ where: { code: roleTypeData.code } });
      if (!existing) {
        const roleType = roleTypeRepository.create(roleTypeData);
        await roleTypeRepository.save(roleType);
        createdRoleTypes.push(roleType);
        logger.info(`  ✅ Created role type: ${roleType.name}`);
      } else {
        createdRoleTypes.push(existing);
      }
    }

    // Create permissions
    const createdPermissions = [];
    for (const permissionData of config.permissions) {
      const existing = await permissionRepository.findOne({
        where: { resource: permissionData.resource, action: permissionData.action }
      });
      if (!existing) {
        const permission = permissionRepository.create(permissionData);
        await permissionRepository.save(permission);
        createdPermissions.push(permission);
        logger.info(`  ✅ Created permission: ${permission.name}`);
      } else {
        createdPermissions.push(existing);
      }
    }

    // Create roles with appropriate permissions
    const createdRoles = [];
    for (const roleType of createdRoleTypes) {
      const existing = await roleRepository.findOne({ where: { roleTypeId: roleType.id } });
      if (!existing) {
        // Assign permissions based on role level
        let rolePermissions = [];
        switch (roleType.level) {
          case RoleLevel.OWNER:
            rolePermissions = createdPermissions; // All permissions
            break;
          case RoleLevel.MANAGER:
            rolePermissions = createdPermissions.filter(p =>
              p.action !== PermissionAction.DELETE && p.resource !== 'analytics'
            );
            break;
          case RoleLevel.PREMIUM:
            rolePermissions = createdPermissions.filter(p =>
              p.action === PermissionAction.READ || p.action === PermissionAction.CREATE ||
              (p.action === PermissionAction.UPDATE && p.resource !== 'users')
            );
            break;
          default:
            rolePermissions = createdPermissions.filter(p =>
              p.action === PermissionAction.READ || p.action === PermissionAction.CREATE
            );
        }

        const role = roleRepository.create({
          name: roleType.name,
          description: `Default ${roleType.name} role for ${tenantType}`,
          roleType: roleType,
          permissions: rolePermissions
        });
        await roleRepository.save(role);
        createdRoles.push(role);
        logger.info(`  ✅ Created role: ${role.name} with ${rolePermissions.length} permissions`);
      } else {
        createdRoles.push(existing);
      }
    }

    // Create default users
    for (const userData of config.defaultUsers) {
      const existing = await userRepository.findOne({ where: { email: userData.email } });
      if (!existing) {
        const roleType = createdRoleTypes.find(rt => rt.code === userData.roleCode);
        const role = createdRoles.find(r => r.roleTypeId === roleType?.id);

        const user = userRepository.create({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: 'password123', // Will be hashed by entity hook
          status: UserStatus.ACTIVE,
          role: role,
          emailVerified: true,
          profile: {
            tenantType: tenantType,
            joinedAt: new Date().toISOString(),
            bio: `Default ${roleType?.name} for ${tenantType} demonstration`
          }
        });
        await userRepository.save(user);
        logger.info(`  ✅ Created user: ${user.fullName} (${roleType?.name})`);
      }
    }

    await tenantDataSource.destroy();
    logger.info(`🎉 ${tenantType} tenant seeding completed for ${schemaName}`);

  } catch (error) {
    logger.error(`❌ Failed to seed ${tenantType} tenant data:`, error);
    throw error;
  }
}