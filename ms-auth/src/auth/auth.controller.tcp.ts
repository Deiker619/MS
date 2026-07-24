import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TokensService } from '../tokens/tokens.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AuthTcpController {
  constructor(
    private readonly tokensService: TokensService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @MessagePattern('validate_token')
  async validateToken(@Payload() data: { token: string }) {
    try {
      const payload = await this.jwtService.verifyAsync(data.token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });

      const isBlacklisted = await this.tokensService.isAccessTokenBlacklisted(
        payload.jti,
      );
      if (isBlacklisted) {
        return { isValid: false, error: 'Token is blacklisted' };
      }

      return { isValid: true, user: payload };
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  }
}
