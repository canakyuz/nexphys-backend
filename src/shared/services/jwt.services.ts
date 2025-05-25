import jwt from 'jsonwebtoken';
import { envConfig } from '@/config/env.config';
import { User } from '@/shared/database/entities/tenant/user.entity';

export interface JwtPayload {
  userId: string;
  email: string;
  roleId?: string;
  roleTypeCode?: string;
  tenantId: string;
  tenantDomain: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

export class JwtService {
  generateAccessToken(user: User, tenantId: string, tenantDomain: string): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId || undefined,
      roleTypeCode: user.role?.roleType?.code || undefined,
      tenantId,
      tenantDomain,
    };

    // @ts-ignore
    return jwt.sign(payload, envConfig.JWT_SECRET, {
      expiresIn: envConfig.JWT_EXPIRES_IN,
    });
  }

  generateRefreshToken(userId: string): string {
    const payload: RefreshTokenPayload = {
      userId,
      tokenId: Date.now().toString()
    };

    // @ts-ignore
    return jwt.sign(payload, envConfig.JWT_REFRESH_SECRET, {
      expiresIn: envConfig.JWT_REFRESH_EXPIRES_IN
    });
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, envConfig.JWT_SECRET) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return jwt.verify(token, envConfig.JWT_REFRESH_SECRET) as RefreshTokenPayload;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
}