import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { HTTP_HEADERS } from '../constants/headers.constants';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const existingCorrelationId = req.headers[HTTP_HEADERS.CORRELATION_ID] as string;
    const correlationId = existingCorrelationId || randomUUID();
    const requestId = randomUUID();

    // Attach to request headers so downstream logic can access them
    req.headers[HTTP_HEADERS.CORRELATION_ID] = correlationId;
    req.headers[HTTP_HEADERS.REQUEST_ID] = requestId;

    // Attach to response headers for client tracking
    res.setHeader(HTTP_HEADERS.CORRELATION_ID, correlationId);
    res.setHeader(HTTP_HEADERS.REQUEST_ID, requestId);

    next();
  }
}
