import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class Jwt2FAPendingGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }

    // Este guard es ESPECÍFICO para cuando el usuario TIENE 2FA pero no lo ha pasado.
    // Si ya lo pasó, o no lo tiene habilitado, igual permitimos el paso,
    // pero idealmente se usa solo en el endpoint de verificación de 2FA.
    return user;
  }
}
