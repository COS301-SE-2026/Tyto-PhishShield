import { SetMetadata } from "@nestjs/common";

export type GatewayRole = 'admin' | 'analyst' | 'user';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: GatewayRole[]) => SetMetadata(ROLES_KEY, roles);