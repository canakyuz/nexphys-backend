// src/modules/auth/services/auth.service.ts - Complete implementation
import { Repository, DataSource } from 'typeorm';
import { createTenantDataSource } from '@/shared/database/config/tenant-connection';
import { User, UserStatus } from '@/shared/database/entities/tenant/user.entity';
import { Role } from '@/shared/database/entities/tenant/role.entity';
import { RoleType, RoleTypeCode } from '@/shared/database/entities/tenant/role-type.entity';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { JwtService } from '@/shared/services/jwt.services';
import { AppError } from '@/shared/middlewares/error.middleware';
import { logger } from '@/shared/utils/logger.util';

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private jwtService: JwtService;

  constructor() {
    this.jwtService = new JwtService();
  }

  async register(registerDto: RegisterDto, tenantId: string, schemaName: string): Promise<AuthResult> {
    const tenantDataSource = createTenantDataSource(schemaName);
    await tenantDataSource.initialize();

    try {
      const userRepository = tenantDataSource.getRepository(User);
      const roleRepository = tenantDataSource.getRepository(Role);
      const roleTypeRepository = tenantDataSource.getRepository(RoleType);

      // Check if user already exists
      const existingUser = await userRepository.findOne({
        where: { email: registerDto.email }
      });

      if (existingUser) {
        throw new AppError('User already exists', 409);
      }

      // Get default CLIENT role
      const clientRoleType = await roleTypeRepository.findOne({
        where: { code: RoleTypeCode.CLIENT }
      });

      if (!clientRoleType) {
        throw new AppError('Default role type not found', 500);
      }

      const defaultRole = await roleRepository.findOne({
        where: { roleTypeId: clientRoleType.id }
      });

      // Create user
      const user = userRepository.create({
        ...registerDto,
        status: UserStatus.ACTIVE,
        roleId: defaultRole?.id,
      });

      await userRepository.save(user);

      // Reload user with relations
      const savedUser = await userRepository.findOne({
        where: { id: user.id },
        relations: ['role', 'role.roleType']
      });

      if (!savedUser) {
        throw new AppError('Failed to create user', 500);
      }

      // Generate tokens
      const accessToken = this.jwtService.generateAccessToken(savedUser, tenantId, schemaName);
      const refreshToken = this.jwtService.generateRefreshToken(savedUser.id);

      logger.info(`User registered: ${savedUser.email} in tenant ${schemaName}`);

      return { user: savedUser, accessToken, refreshToken };
    } finally {
      await tenantDataSource.destroy();
    }
  }

  async login(loginDto: LoginDto, tenantId: string, schemaName: string): Promise<AuthResult> {
    const tenantDataSource = createTenantDataSource(schemaName);
    await tenantDataSource.initialize();

    try {
      const userRepository = tenantDataSource.getRepository(User);

      // Find user with relations
      const user = await userRepository.findOne({
        where: { email: loginDto.email },
        relations: ['role', 'role.roleType']
      });

      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      // Validate password
      const isValidPassword = await user.validatePassword(loginDto.password);
      if (!isValidPassword) {
        throw new AppError('Invalid credentials', 401);
      }

      if (user.status !== UserStatus.ACTIVE) {
        throw new AppError('User account is not active', 403);
      }

      // Update last login
      user.lastLoginAt = new Date();
      await userRepository.save(user);

      // Generate tokens
      const accessToken = this.jwtService.generateAccessToken(user, tenantId, schemaName);
      const refreshToken = this.jwtService.generateRefreshToken(user.id);

      logger.info(`User logged in: ${user.email} in tenant ${schemaName}`);

      return { user, accessToken, refreshToken };
    } finally {
      await tenantDataSource.destroy();
    }
  }

  async getProfile(userId: string, schemaName: string): Promise<User> {
    const tenantDataSource = createTenantDataSource(schemaName);
    await tenantDataSource.initialize();

    try {
      const userRepository = tenantDataSource.getRepository(User);

      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ['role', 'role.roleType', 'role.permissions']
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      return user;
    } finally {
      await tenantDataSource.destroy();
    }
  }

  async refreshToken(refreshToken: string, tenantId: string, schemaName: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verifyRefreshToken(refreshToken);

      // Get user to generate new access token
      const tenantDataSource = createTenantDataSource(schemaName);
      await tenantDataSource.initialize();

      try {
        const userRepository = tenantDataSource.getRepository(User);
        const user = await userRepository.findOne({
          where: { id: payload.userId },
          relations: ['role', 'role.roleType']
        });

        if (!user) {
          throw new AppError('User not found', 404);
        }

        // Generate new tokens
        const newAccessToken = this.jwtService.generateAccessToken(user, tenantId, schemaName);
        const newRefreshToken = this.jwtService.generateRefreshToken(user.id);

        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
      } finally {
        await tenantDataSource.destroy();
      }
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }
}