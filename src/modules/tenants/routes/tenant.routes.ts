import { Router } from 'express';
import { TenantController } from '../controllers/tenant.controller';
import { validationMiddleware } from '@/shared/middlewares/validation.middleware';
import { CreateTenantDto } from '../dto/create-tenant.dto';

const router = Router();
const tenantController = new TenantController();

router.post('/', validationMiddleware(CreateTenantDto), tenantController.createTenant);
router.get('/', tenantController.getTenants);
router.get('/:id', tenantController.getTenantById);
router.put('/:id', tenantController.updateTenant);
router.delete('/:id', tenantController.deleteTenant);

export { router as tenantRoutes };