import { Global, Module } from '@nestjs/common';
import { createAuthInstance } from '../../auth/auth.instance';
import { SessionGuard } from './session.guard';
import { RolesGuard } from './roles.guard';
import { AUTH_INSTANCE } from './auth.tokens';

export { AUTH_INSTANCE } from './auth.tokens';

@Global()
@Module({
  providers: [
    {
      provide: AUTH_INSTANCE,
      useFactory: () => createAuthInstance(),
    },
    SessionGuard,
    RolesGuard,
  ],
  exports: [AUTH_INSTANCE, SessionGuard, RolesGuard],
})
export class AuthModule {}
