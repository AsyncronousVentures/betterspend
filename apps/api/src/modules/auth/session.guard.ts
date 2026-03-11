import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { AUTH_INSTANCE } from './auth.tokens';
import type { AuthInstance, AuthUser } from '../../auth/auth.instance';
import { DB_TOKEN } from '../../database/database.module';
import { eq } from 'drizzle-orm';
import * as schema from '@betterspend/db';

// Extend Express Request to carry our user type
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authUser?: AuthUser & { roles: Array<{ role: string; scopeType: string; scopeId: string | null }> };
    }
  }
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTH_INSTANCE) private readonly auth: AuthInstance,
    @Inject(DB_TOKEN) private readonly db: ReturnType<typeof import('drizzle-orm/postgres-js').drizzle>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const token = this.extractToken(req);

    // No token — allow through in demo/dev mode (@CurrentOrgId falls back to demo IDs)
    if (!token) return true;

    // Token present — validate with better-auth
    const headers = this.buildHeaders(req);
    const sessionData = await this.auth.api.getSession({ headers });

    if (!sessionData) {
      throw new UnauthorizedException('Invalid or expired session token');
    }

    // Load roles and attach session user to request
    const roles = await (this.db as any)
      .select()
      .from(schema.userRoles)
      .where(eq(schema.userRoles.userId, sessionData.user.id));

    req.authUser = { ...sessionData.user, roles };
    return true;
  }

  private extractToken(req: Request): string | null {
    const auth = req.headers['authorization'];
    if (typeof auth === 'string' && auth.startsWith('Bearer ')) return auth.slice(7);
    // Also detect better-auth cookie-based sessions
    const cookies = req.headers['cookie'];
    if (typeof cookies === 'string' && cookies.includes('better-auth.session_token')) return 'cookie';
    return null;
  }

  private buildHeaders(req: Request): Headers {
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        value.forEach((v) => headers.append(key, v));
      } else {
        headers.set(key, value);
      }
    }
    return headers;
  }
}
