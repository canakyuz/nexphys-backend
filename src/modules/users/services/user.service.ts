import { Repository, DataSource, Like, FindManyOptions } from 'typeorm';
import { getTenantConnection } from '@/shared/database/config/tenant-connection';
import { User, UserStatus } from '@/shared/database/entities/tenant/user.entity';
import { Role } from '@/shared/database/entities/tenant/role.entity';
import { RoleType } from '@/shared/database/entities/tenant/role-type.entity';
import { CreateUserDto, UpdateUserDto, UpdateUserRoleDto, UserQueryDto } from '../dto';
import { AppError } from '@/shared/middlewares/error.middleware';
import { logger } from '@/shared/utils/logger.util';
import { envConfig } from '@/config/env.config';

export interface UserListResult {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class UserService {
  private async getTenantDataSource(schemaName: string): Promise<DataSource> {
    return await getTenantConnection(schemaName);
  }

  private async getUserRepository(schemaName: string): Promise<Repository<User>> {
    const dataSource = await this.getTenantDataSource(schemaName);
    return dataSource.getRepository(User);
  }

  private async getRoleRepository(schemaName: string): Promise<Repository<Role>> {
    const dataSource = await this.getTenantDataSource(schemaName);
    return dataSource.getRepository(Role);
  }

  // **Create User**
  async createUser(createUserDto: CreateUserDto, schemaName: string): Promise<User> {
    try {
      const userRepository = await this.getUserRepository(schemaName);
      const roleRepository = await this.getRoleRepository(schemaName);

      // Check if user already exists
      const existingUser = await userRepository.findOne({
        where: { email: createUserDto.email }
      });

      if (existingUser) {
        throw new AppError('User with this email already exists', 409);
      }

      // Validate role if provided
      let role = null;
      if (createUserDto.roleId) {
        role = await roleRepository.findOne({
          where: { id: createUserDto.roleId },
          relations: ['roleType']
        });

        if (!role) {
          throw new AppError('Role not found', 404);
        }
      }

      // Create user
      const user = userRepository.create({
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        email: createUserDto.email,
        password: createUserDto.password, // Will be hashed by entity hook
        phone: createUserDto.phone,
        dateOfBirth: createUserDto.dateOfBirth ? new Date(createUserDto.dateOfBirth) : undefined,
        status: createUserDto.status || UserStatus.ACTIVE,
        roleId: createUserDto.roleId,
        profile: createUserDto.profile || {},
        emailVerified: false
      });

      await userRepository.save(user);

      // Reload with relations
      const savedUser = await userRepository.findOne({
        where: { id: user.id },
        relations: ['role', 'role.roleType', 'role.permissions']
      });

      if (!savedUser) {
        throw new AppError('Failed to create user', 500);
      }

      logger.info(`User created: ${savedUser.email} in schema ${schemaName}`);
      return savedUser;

    } catch (error) {
      logger.error(`Failed to create user in ${schemaName}:`, error);
      throw error;
    }
  }

  // **Get Users List with Filtering & Pagination**
  async getUsers(queryDto: UserQueryDto, schemaName: string): Promise<UserListResult> {
    try {
      const userRepository = await this.getUserRepository(schemaName);

      const {
        page = 1,
        limit = envConfig.DEFAULT_PAGE_SIZE,
        search,
        status,
        roleId,
        roleTypeCode
      } = queryDto;

      // Build query conditions
      const where: any = {};
      
      if (status) {
        where.status = status;
      }

      if (roleId) {
        where.roleId = roleId;
      }

      // Search in name and email
      if (search) {
        // For TypeORM, we need to use FindOptionsWhere array for OR condition
        const searchConditions = [
          { firstName: Like(`%${search}%`) },
          { lastName: Like(`%${search}%`) },
          { email: Like(`%${search}%`) }
        ];
        
        const [users, total] = await userRepository.findAndCount({
          where: searchConditions,
          relations: ['role', 'role.roleType'],
          skip: (page - 1) * limit,
          take: limit,
          order: { createdAt: 'DESC' }
        });

        const totalPages = Math.ceil(total / limit);

        return {
          data: users,
          total,
          page,
          limit,
          totalPages
        };
      }

      const queryOptions: FindManyOptions<User> = {
        where,
        relations: ['role', 'role.roleType'],
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' }
      };

      const [users, total] = await userRepository.findAndCount(queryOptions);
      const totalPages = Math.ceil(total / limit);

      return {
        data: users,
        total,
        page,
        limit,
        totalPages
      };

    } catch (error) {
      logger.error(`Failed to get users in ${schemaName}:`, error);
      throw error;
    }
  }

  // **Get User by ID**
  async getUserById(userId: string, schemaName: string): Promise<User> {
    try {
      const userRepository = await this.getUserRepository(schemaName);

      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ['role', 'role.roleType', 'role.permissions']
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      return user;

    } catch (error) {
      logger.error(`Failed to get user ${userId} in ${schemaName}:`, error);
      throw error;
    }
  }

  // **Update User**
  async updateUser(userId: string, updateUserDto: UpdateUserDto, schemaName: string): Promise<User> {
    try {
      const userRepository = await this.getUserRepository(schemaName);

      const user = await this.getUserById(userId, schemaName);

      // Update fields
      if (updateUserDto.firstName) user.firstName = updateUserDto.firstName;
      if (updateUserDto.lastName) user.lastName = updateUserDto.lastName;
      if (updateUserDto.phone !== undefined) user.phone = updateUserDto.phone;
      if (updateUserDto.dateOfBirth) user.dateOfBirth = new Date(updateUserDto.dateOfBirth);
      if (updateUserDto.status) user.status = updateUserDto.status;
      if (updateUserDto.profile) user.profile = { ...user.profile, ...updateUserDto.profile };

      await userRepository.save(user);

      logger.info(`User updated: ${user.email} in schema ${schemaName}`);

      // Return updated user with relations
      return await this.getUserById(userId, schemaName);

    } catch (error) {
      logger.error(`Failed to update user ${userId} in ${schemaName}:`, error);
      throw error;
    }
  }

  // **Update User Role**
  async updateUserRole(userId: string, updateRoleDto: UpdateUserRoleDto, schemaName: string): Promise<User> {
    try {
      const userRepository = await this.getUserRepository(schemaName);
      const roleRepository = await this.getRoleRepository(schemaName);

      const user = await this.getUserById(userId, schemaName);

      // Validate new role
      const newRole = await roleRepository.findOne({
        where: { id: updateRoleDto.roleId },
        relations: ['roleType']
      });

      if (!newRole) {
        throw new AppError('Role not found', 404);
      }

      // Update role
      user.roleId = updateRoleDto.roleId;
      await userRepository.save(user);

      logger.info(`User role updated: ${user.email} → ${newRole.name} in schema ${schemaName}`);

      // Return updated user with relations
      return await this.getUserById(userId, schemaName);

    } catch (error) {
      logger.error(`Failed to update user role ${userId} in ${schemaName}:`, error);
      throw error;
    }
  }

  // **Toggle User Status**
  async toggleUserStatus(userId: string, schemaName: string): Promise<User> {
    try {
      const userRepository = await this.getUserRepository(schemaName);
      const user = await this.getUserById(userId, schemaName);

      // Toggle status
      user.status = user.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;
      await userRepository.save(user);

      logger.info(`User status toggled: ${user.email} → ${user.status} in schema ${schemaName}`);

      return await this.getUserById(userId, schemaName);

    } catch (error) {
      logger.error(`Failed to toggle user status ${userId} in ${schemaName}:`, error);
      throw error;
    }
  }

  // **Delete User (Soft Delete)**
  async deleteUser(userId: string, schemaName: string): Promise<void> {
    try {
      const userRepository = await this.getUserRepository(schemaName);
      const user = await this.getUserById(userId, schemaName);

      // Soft delete
      await userRepository.softRemove(user);

      logger.info(`User deleted: ${user.email} in schema ${schemaName}`);

    } catch (error) {
      logger.error(`Failed to delete user ${userId} in ${schemaName}:`, error);
      throw error;
    }
  }

  // **Search Users**
  async searchUsers(searchTerm: string, schemaName: string, limit: number = 10): Promise<User[]> {
    try {
      const userRepository = await this.getUserRepository(schemaName);

      const users = await userRepository.find({
        where: [
          { firstName: Like(`%${searchTerm}%`) },
          { lastName: Like(`%${searchTerm}%`) },
          { email: Like(`%${searchTerm}%`) }
        ],
        relations: ['role', 'role.roleType'],
        take: limit,
        order: { createdAt: 'DESC' }
      });

      return users;

    } catch (error) {
      logger.error(`Failed to search users in ${schemaName}:`, error);
      throw error;
    }
  }
}
