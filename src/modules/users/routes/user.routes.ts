import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { validationMiddleware } from '@/shared/middlewares/validation.middleware';
import { tenantMiddleware } from '@/modules/tenants/middlewares/tenant.middleware';
import { authMiddleware } from '@/modules/auth/middlewares/auth.middleware';
import { CreateUserDto, UpdateUserDto, UpdateUserRoleDto, UserQueryDto } from '../dto';

const router = Router();
const userController = new UserController();

// Apply tenant middleware to all routes
router.use(tenantMiddleware);

// **Public routes (require authentication but basic permissions)**
router.get('/search', authMiddleware, userController.searchUsers);

// **Current user routes**
router.get('/me', authMiddleware, userController.getCurrentUser);
router.put('/me', authMiddleware, validationMiddleware(UpdateUserDto), userController.updateCurrentUser);

// **User management routes (require authentication + appropriate permissions)**
router.get('/', authMiddleware, validationMiddleware(UserQueryDto, 'query'), userController.getUsers);
router.post('/', authMiddleware, validationMiddleware(CreateUserDto), userController.createUser);
router.get('/stats', authMiddleware, userController.getUserStats);
router.get('/:id', authMiddleware, userController.getUserById);
router.put('/:id', authMiddleware, validationMiddleware(UpdateUserDto), userController.updateUser);
router.put('/:id/role', authMiddleware, validationMiddleware(UpdateUserRoleDto), userController.updateUserRole);
router.post('/:id/toggle-status', authMiddleware, userController.toggleUserStatus);
router.delete('/:id', authMiddleware, userController.deleteUser);

export { router as userRoutes };
