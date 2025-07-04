import { Router } from 'express';
import { ResponseUtil } from '@/shared/utils/response.util';

const router = Router();

// Placeholder routes
router.get('/', (req, res) => {
  ResponseUtil.success(res, [], 'Roles endpoint - Coming soon');
});

export { router as roleRoutes };