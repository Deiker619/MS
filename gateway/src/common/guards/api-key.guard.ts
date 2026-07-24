import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { REQUIRE_API_KEY_KEY } from '../decorators/api-key.decorator';
import { HTTP_HEADERS } from '../constants/headers.constants';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requireApiKey = this.reflector.getAllAndOverride<boolean>(REQUIRE_API_KEY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requireApiKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const apiKeyHeaderName = this.configService.get<string>(
      'security.apiKeyHeader',
      HTTP_HEADERS.API_KEY,
    );
    const expectedApiKey = this.configService.get<string>('security.gatewayApiKey');

    const providedApiKey = request.headers[apiKeyHeaderName.toLowerCase()];

    if (!providedApiKey || providedApiKey !== expectedApiKey) {
      throw new UnauthorizedException('Invalid or missing API Key');
    }

    return true;
  }
}
