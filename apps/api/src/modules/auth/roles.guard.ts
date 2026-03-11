import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY, UserRole } from '../../common/decorators/roles.decorator';

const DEMO_ADMIN_ID = '00000000-0000-0000-0000-000000000002';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    // No @Roles() — allow any authenticated (or demo) user through
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const { authUser } = req;

    // Demo mode: no session present. Allow the demo admin fallback to pass.
    // Real unauthenticated requests will have been blocked by SessionGuard already
    // when a token was presented; no-token requests fall through in soft-auth mode.
    if (!authUser || authUser.id === DEMO_ADMIN_ID) return true;

    // Global admin always passes, regardless of what roles are required
    const isAdmin = authUser.roles?.some((r) => r.role === 'admin');
    if (isAdmin) return true;

    // Check whether the user holds at least one of the required roles
    const hasRole = requiredRoles.some((required) =>
      authUser.roles?.some((r) => r.role === required),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `Requires one of: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
