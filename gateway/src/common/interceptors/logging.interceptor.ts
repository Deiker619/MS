import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { HTTP_HEADERS } from '../constants/headers.constants';
import { AppLoggerService } from '../../shared/logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {
    this.logger.setContext(LoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const correlationId = (request.headers[HTTP_HEADERS.CORRELATION_ID] as string) || 'N/A';
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          this.logger.log(
            `Incoming Request Handled: ${method} ${url} ${statusCode} - ${duration}ms`,
            LoggingInterceptor.name,
            correlationId,
          );
        },
        error: (err) => {
          const duration = Date.now() - startTime;
          this.logger.warn(
            `Incoming Request Failed: ${method} ${url} - ${duration}ms - Error: ${err.message}`,
            LoggingInterceptor.name,
            correlationId,
          );
        },
      }),
    );
  }
}
