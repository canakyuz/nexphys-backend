import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../services/tenant.service';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { ResponseUtil } from '@/shared/utils/response.util';
import { asyncHandler } from '@/shared/middlewares/error.middleware';
import { envConfig } from '@/config/env.config';

export class TenantController {
  private tenantService: TenantService;

  constructor() {
    this.tenantService = new TenantService();
  }

  createTenant = asyncHandler(async (req: Request, res: Response) => {
    const createTenantDto: CreateTenantDto = req.body;
    const tenant = await this.tenantService.createTenant(createTenantDto);

    return ResponseUtil.created(res, tenant, 'Tenant created successfully');
  });

  getTenants = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(
      parseInt(req.query.limit as string) || envConfig.DEFAULT_PAGE_SIZE,
      envConfig.MAX_PAGE_SIZE
    );

    const { data, total } = await this.tenantService.getTenants(page, limit);

    return ResponseUtil.paginated(res, data, total, page, limit, 'Tenants retrieved successfully');
  });

  getTenantById = asyncHandler(async (req: Request, res: Response) => {
    const tenant = await this.tenantService.getTenantById(req.params.id);

    return ResponseUtil.success(res, tenant, 'Tenant retrieved successfully');
  });

  updateTenant = asyncHandler(async (req: Request, res: Response) => {
    const tenant = await this.tenantService.updateTenant(req.params.id, req.body);

    return ResponseUtil.success(res, tenant, 'Tenant updated successfully');
  });

  deleteTenant = asyncHandler(async (req: Request, res: Response) => {
    await this.tenantService.deleteTenant(req.params.id);

    return ResponseUtil.noContent(res, 'Tenant deleted successfully');
  });
}