import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    // Platform admins bypass tenant check
    if (user.role === 'PLATFORM_ADMIN') return true;

    // User must belong to a tenant
    if (!user.tenantId) {
      throw new ForbiddenException('Usuario no asociado a un consultorio');
    }

    // Set tenantId on request for downstream use
    request.tenantId = user.tenantId;
    return true;
  }
}
