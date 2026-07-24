import { Controller, All, Req, Res } from '@nestjs/common';
import * as express from 'express';
import { ProxyService } from './proxy.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller()
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Public()
  @All(['auth', 'auth/*path'])
  proxyAuth(@Req() req: express.Request, @Res() res: express.Response): void {
    this.proxyService.forward('auth', req, res);
  }

  @All(['logs', 'logs/*path'])
  proxyLogs(@Req() req: express.Request, @Res() res: express.Response): void {
    this.proxyService.forward('logs', req, res);
  }
}
