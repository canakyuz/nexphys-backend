// src/modules/auth/controllers/auth.controller.ts - Import düzeltmesi
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ResponseUtil } from '@/shared/utils/response.util';
import { asyncHandler } from '@/shared/middlewares/error.middleware';
import { TenantRequest } from '@/modules/tenants/middlewares/tenant.middleware';
import { JwtPayload } from '@/shared/services/jwt.services'; // .services değil .service

export interface AuthenticatedRequest extends TenantRequest {
  user?: JwtPayload;
}

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = asyncHandler(async (req: TenantRequest, res: Response) => {
    const registerDto: RegisterDto = req.body;
    const result = await this.authService.register(
      registerDto,
      req.tenant.id,
      req.tenant.schemaName
    );

    return ResponseUtil.created(res, result, 'Registration successful');
  });

  login = asyncHandler(async (req: TenantRequest, res: Response) => {
    const loginDto: LoginDto = req.body;
    const result = await this.authService.login(
      loginDto,
      req.tenant.id,
      req.tenant.schemaName
    );

    return ResponseUtil.success(res, result, 'Login successful');
  });

  getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const user = await this.authService.getProfile(
      req.user.userId,
      req.tenant.schemaName
    );

    return ResponseUtil.success(res, user, 'Profile retrieved successfully');
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken, tenantId, schemaName } = req.body;

    if (!refreshToken || !tenantId || !schemaName) {
      throw new Error('Refresh token, tenant ID, and schema name are required');
    }

    const result = await this.authService.refreshToken(refreshToken, tenantId, schemaName);

    return ResponseUtil.success(res, result, 'Token refreshed successfully');
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    // In production, invalidate the refresh token here
    return ResponseUtil.success(res, null, 'Logout successful');
  });
}