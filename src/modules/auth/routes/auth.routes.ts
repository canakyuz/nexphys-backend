import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validationMiddleware } from '@/shared/middlewares/validation.middleware';
import { tenantMiddleware } from '@/modules/tenants/middlewares/tenant.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

const router = Router();
const authController = new AuthController();

// Public routes (require tenant)
router.post('/register', tenantMiddleware, validationMiddleware(RegisterDto), authController.register);
router.post('/login', tenantMiddleware, validationMiddleware(LoginDto), authController.login);
router.post('/refresh', authController.refreshToken);

// Protected routes
router.get('/profile', tenantMiddleware, authMiddleware, authController.getProfile);
router.post('/logout', authMiddleware, authController.logout);

export { router as authRoutes };