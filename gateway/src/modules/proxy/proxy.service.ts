import { Injectable, NotFoundException, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import proxy from 'express-http-proxy';
import { HTTP_HEADERS } from '../../common/constants/headers.constants';
import { MicroserviceRouteConfig } from '../../config/services.config';
import { AppLoggerService } from '../../shared/logger/logger.service';

@Injectable()
export class ProxyService {
  private readonly routes: MicroserviceRouteConfig[];

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(ProxyService.name);
    this.routes = this.configService.get<MicroserviceRouteConfig[]>('services.routes', []);
  }

  forward(serviceName: string, req: Request, res: Response): void {
    const routeConfig = this.routes.find((r) => r.prefix.toLowerCase() === serviceName.toLowerCase());

    if (!routeConfig || !routeConfig.targetUrl) {
      this.logger.warn(`No target microservice configured for path prefix: '${serviceName}'`);
      throw new NotFoundException(`Microservice route '/${serviceName}' not found on API Gateway`);
    }

    const targetUrl = routeConfig.targetUrl;
    const correlationId = (req.headers[HTTP_HEADERS.CORRELATION_ID] as string) || '';
    const requestId = (req.headers[HTTP_HEADERS.REQUEST_ID] as string) || '';

    const proxyMiddleware = (proxy as unknown as (url: string, options?: any) => any)(targetUrl, {
      proxyReqPathResolver: (request: Request) => {
        const originalUrl = request.originalUrl;
        const apiPrefix = this.configService.get<string>('app.apiPrefix', 'api');
        const apiVersion = this.configService.get<string>('app.apiVersion', '1');
        
        const gatewayPrefix = `/${apiPrefix}/v${apiVersion}`;
        let resolvedPath = originalUrl;
        
        if (resolvedPath.startsWith(gatewayPrefix)) {
          resolvedPath = resolvedPath.replace(gatewayPrefix, '');
        }

        return resolvedPath;
      },
      proxyReqOptDecorator: (proxyReqOpts: any, srcReq: Request) => {
        proxyReqOpts.headers[HTTP_HEADERS.CORRELATION_ID] = correlationId;
        proxyReqOpts.headers[HTTP_HEADERS.REQUEST_ID] = requestId;

        if (srcReq.user) {
          const user = srcReq.user as any;
          if (user.userId) proxyReqOpts.headers[HTTP_HEADERS.USER_ID] = user.userId;
          if (user.email) proxyReqOpts.headers[HTTP_HEADERS.USER_EMAIL] = user.email;
          if (user.roles) {
            proxyReqOpts.headers[HTTP_HEADERS.USER_ROLES] = Array.isArray(user.roles)
              ? user.roles.join(',')
              : String(user.roles);
          }
        }

        return proxyReqOpts;
      },
      proxyErrorHandler: (err: any, response: Response) => {
        this.logger.error(
          `Proxy error connecting to microservice ${targetUrl}: ${err.message}`,
          err.stack,
          ProxyService.name,
          correlationId,
        );
        response.status(502).json({
          statusCode: 502,
          error: 'Bad Gateway',
          message: `Could not reach downstream microservice '${serviceName}'`,
          timestamp: new Date().toISOString(),
          correlationId,
          requestId,
        });
      },
      timeout: routeConfig.timeoutMs || this.configService.get<number>('app.proxyTimeoutMs', 10000),
    });

    proxyMiddleware(req, res, (err: any) => {
      if (err) {
        throw new BadGatewayException(`Proxy forwarding error: ${err.message}`);
      }
    });
  }
}
