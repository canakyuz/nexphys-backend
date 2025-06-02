import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validationMiddleware } from '@/shared/middlewares/validation.middleware';
import { tenantMiddleware } from '@/modules/tenants/middlewares/tenant.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { envConfig } from '@/config/env.config';

const router = Router();
const authController = new AuthController();

//================================================
// Routes
//================================================

// Auth rotaları düzeltildi - envConfig.API_PREFIX server.ts'de ekleniyor
router.post(`/register`, tenantMiddleware, validationMiddleware(RegisterDto), authController.register);
router.post(`/login`, tenantMiddleware, validationMiddleware(LoginDto), authController.login);
router.post(`/refresh`, authController.refreshToken);
router.get(`/profile`, tenantMiddleware, authMiddleware, authController.getProfile);
router.post(`/logout`, authMiddleware, authController.logout);

//================================================
// Export
//================================================

export { router as authRoutes };