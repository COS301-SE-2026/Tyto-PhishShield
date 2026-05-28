import {
    Injectable, CanActivate, ExecutionContext, ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [

            context.getHandler(),
            context.getClass(),
        ]);

        if (!required) {
            
            return true;
        }

        const { user } = context.switchToHttp().getRequest() as { user: { role: string } };

        if (!required.includes(user.role as UserRole)) {
            throw new ForbiddenException('You do not have permission to access this resource');
        }

        return true;
    }
}