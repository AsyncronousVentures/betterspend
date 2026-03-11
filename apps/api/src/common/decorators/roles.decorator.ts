import { SetMetadata } from '@nestjs/common';

export type UserRole = 'admin' | 'approver' | 'requester' | 'receiver' | 'finance';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
