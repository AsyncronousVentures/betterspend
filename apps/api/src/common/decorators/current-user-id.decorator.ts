import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000002';

export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<Request>();
    // Use session user's ID if available (after SessionGuard runs)
    if (req.authUser?.id) return req.authUser.id;
    // Fallback: explicit header (useful for testing / Swagger)
    const header = req.headers['x-user-id'];
    return (typeof header === 'string' && header) ? header : DEMO_USER_ID;
  },
);
