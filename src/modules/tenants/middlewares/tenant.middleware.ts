import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../services/tenant.service';
import { AppError } from '@/shared/middlewares/error.middleware';

export interface TenantRequest extends Request {
  tenant?: any;
  tenantDataSource?: any;
}

const tenantService = new TenantService();

export const tenantMiddleware = async (req: TenantRequest, res: Response, next: NextFunction) => {
  try {
    const tenantDomain = req.headers['x-tenant-domain'] as string ||
      req.subdomains[0] ||
      req.query.tenant as string;

    if (!tenantDomain) {
      throw new AppError('Tenant domain is required', 400);
    }

    // Get tenant info
    const tenant = await tenantService.getTenantByDomain(tenantDomain);

    if (!tenant.isActive) {
      throw new AppError('Tenant is not active', 403);
    }

    req.tenant = tenant;
    next();
  } catch (error) {
    next(error);
  }
};