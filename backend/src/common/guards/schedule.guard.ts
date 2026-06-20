import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Permite editar el horario del doctor a:
 *  - DOCTOR / PLATFORM_ADMIN (siempre)
 *  - SECRETARY solo si el doctor le concedió `canManageSchedule`
 * Las lecturas del horario NO usan este guard (cualquier usuario del consultorio puede verlas).
 */
@Injectable()
export class ScheduleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    if (user.role === 'DOCTOR' || user.role === 'PLATFORM_ADMIN') return true;

    if (user.role === 'SECRETARY' && user.canManageSchedule) return true;

    throw new ForbiddenException(
      'No tienes permiso para editar el horario del doctor',
    );
  }
}
