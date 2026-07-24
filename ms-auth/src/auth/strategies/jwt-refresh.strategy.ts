import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { TokensService } from '../../tokens/tokens.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly tokensService: TokensService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'), // You could also use fromAuthHeaderAsBearerToken
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') as string,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const refreshToken = req.body.refreshToken;

    // Check if the refresh token is valid in Redis
    await this.tokensService.validateRefreshToken(payload.sub, refreshToken);

    return {
      userId: payload.sub,
      refreshToken,
    };
  }
}
