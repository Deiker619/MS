import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../../tokens/tokens.service';
import { TokensService } from '../../tokens/tokens.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly tokensService: TokensService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') as string,
      // Obtenemos todo el JWT crudo para sacar el jti si hace falta
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    // Check if token is blacklisted via Redis
    const isBlacklisted = await this.tokensService.isAccessTokenBlacklisted(
      payload.jti,
    );
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Retornamos el usuario junto con el estado del 2FA sacado del token
    return {
      ...user,
      isTwoFactorPassed: payload.isTwoFactorPassed,
      jti: payload.jti,
      exp: payload.exp,
    };
  }
}
