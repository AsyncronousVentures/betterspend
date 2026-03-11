import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001';

export const CurrentOrgId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<Request>();
    // Use session user's org if available (after SessionGuard runs)
    if (req.authUser?.organizationId) return req.authUser.organizationId;
    // Fallback: explicit header (useful for testing / Swagger)
    const header = req.headers['x-org-id'];
    return (typeof header === 'string' && header) ? header : DEMO_ORG_ID;
  },
);
