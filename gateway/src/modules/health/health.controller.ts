import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../common/decorators/public.decorator';

@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly configService: ConfigService,
  ) {}

  @Get('liveness')
  @HealthCheck()
  checkLiveness() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB heap limit alert
    ]);
  }

  @Get('readiness')
  @HealthCheck()
  checkReadiness() {
    const authUrl = this.configService.get<string>('services.authServiceUrl') || 'http://localhost:3001';
    const logsUrl = this.configService.get<string>('services.logsServiceUrl') || 'http://localhost:3002';

    return this.health.check([
      () => this.http.pingCheck('auth_service', `${authUrl}/health`).catch(() => ({
        auth_service: { status: 'down', message: 'Auth Service unreachable' },
      })),
      () => this.http.pingCheck('logs_service', `${logsUrl}/health`).catch(() => ({
        logs_service: { status: 'down', message: 'Logs Service unreachable' },
      })),
    ]);
  }
}
