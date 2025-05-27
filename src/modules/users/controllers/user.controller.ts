import { Response } from 'express';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto, UpdateUserRoleDto, UserQueryDto } from '../dto';
import { ResponseUtil } from '@/shared/utils/response.util';
import { asyncHandler } from '@/shared/middlewares/error.middleware';
import { TenantRequest } from '@/modules/tenants/middlewares/tenant.middleware';
import { AuthenticatedRequest } from '@/modules/auth/controllers/auth.controller';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  // **Create User** 
  // POST /api/v1/users
  createUser = asyncHandler(async (req: TenantRequest, res: Response) => {
    const createUserDto: CreateUserDto = req.body;
    
    const user = await this.userService.createUser(
      createUserDto,
      req.tenant.schemaName
    );

    return ResponseUtil.created(res, user, 'User created successfully');
  });

  // **Get Users List with Pagination & Filtering**
  // GET /api/v1/users?page=1&limit=20&search=john&status=ACTIVE&roleId=xxx
  getUsers = asyncHandler(async (req: TenantRequest, res: Response) => {
    const queryDto: UserQueryDto = req.query as any;

    const result = await this.userService.getUsers(
      queryDto,
      req.tenant.schemaName
    );

    return ResponseUtil.paginated(
      res,
      result.data,
      result.total,
      result.page,
      result.limit,
      'Users retrieved successfully'
    );
  });

  // **Get User by ID**
  // GET /api/v1/users/:id
  getUserById = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { id } = req.params;

    const user = await this.userService.getUserById(
      id,
      req.tenant.schemaName
    );

    return ResponseUtil.success(res, user, 'User retrieved successfully');
  });

  // **Update User**
  // PUT /api/v1/users/:id
  updateUser = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { id } = req.params;
    const updateUserDto: UpdateUserDto = req.body;

    const user = await this.userService.updateUser(
      id,
      updateUserDto,
      req.tenant.schemaName
    );

    return ResponseUtil.success(res, user, 'User updated successfully');
  });

  // **Update User Role**
  // PUT /api/v1/users/:id/role
  updateUserRole = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { id } = req.params;
    const updateRoleDto: UpdateUserRoleDto = req.body;

    const user = await this.userService.updateUserRole(
      id,
      updateRoleDto,
      req.tenant.schemaName
    );

    return ResponseUtil.success(res, user, 'User role updated successfully');
  });

  // **Toggle User Status (Activate/Deactivate)**
  // POST /api/v1/users/:id/toggle-status
  toggleUserStatus = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { id } = req.params;

    const user = await this.userService.toggleUserStatus(
      id,
      req.tenant.schemaName
    );

    return ResponseUtil.success(res, user, 'User status updated successfully');
  });

  // **Delete User (Soft Delete)**
  // DELETE /api/v1/users/:id
  deleteUser = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { id } = req.params;

    await this.userService.deleteUser(
      id,
      req.tenant.schemaName
    );

    return ResponseUtil.noContent(res, 'User deleted successfully');
  });

  // **Search Users**
  // GET /api/v1/users/search?q=searchTerm&limit=10
  searchUsers = asyncHandler(async (req: TenantRequest, res: Response) => {
    const { q: searchTerm, limit } = req.query;

    if (!searchTerm || typeof searchTerm !== 'string') {
      return ResponseUtil.error(res, 'Search term is required', null, 400);
    }

    const users = await this.userService.searchUsers(
      searchTerm,
      req.tenant.schemaName,
      limit ? parseInt(limit as string) : 10
    );

    return ResponseUtil.success(res, users, 'Search results retrieved successfully');
  });

  // **Get Current User's Profile**
  // GET /api/v1/users/me
  getCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ResponseUtil.error(res, 'User not authenticated', null, 401);
    }

    const user = await this.userService.getUserById(
      req.user.userId,
      req.tenant.schemaName
    );

    return ResponseUtil.success(res, user, 'Current user profile retrieved successfully');
  });

  // **Update Current User's Profile**
  // PUT /api/v1/users/me
  updateCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return ResponseUtil.error(res, 'User not authenticated', null, 401);
    }

    const updateUserDto: UpdateUserDto = req.body;

    const user = await this.userService.updateUser(
      req.user.userId,
      updateUserDto,
      req.tenant.schemaName
    );

    return ResponseUtil.success(res, user, 'Profile updated successfully');
  });

  // **Get User Statistics**
  // GET /api/v1/users/stats
  getUserStats = asyncHandler(async (req: TenantRequest, res: Response) => {
    // Placeholder for future implementation
    const stats = {
      totalUsers: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      usersByRole: {},
      recentlyJoined: 0
    };

    return ResponseUtil.success(res, stats, 'User statistics retrieved successfully');
  });
}
