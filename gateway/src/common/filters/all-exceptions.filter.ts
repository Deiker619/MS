import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { HTTP_HEADERS } from '../constants/headers.constants';
import { AppLoggerService } from '../../shared/logger/logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId = (request.headers[HTTP_HEADERS.CORRELATION_ID] as string) || 'N/A';
    const requestId = (request.headers[HTTP_HEADERS.REQUEST_ID] as string) || 'N/A';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorTitle = 'Internal Server Error';
    let message: string | object = 'An unexpected error occurred on the API Gateway';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resObj = exception.getResponse();

      if (typeof resObj === 'string') {
        message = resObj;
      } else if (typeof resObj === 'object' && resObj !== null) {
        const obj = resObj as Record<string, any>;
        errorTitle = obj.error || exception.name;
        message = obj.message || resObj;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorTitle = exception.name;
    }

    const errorResponse = {
      statusCode: status,
      error: errorTitle,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      correlationId,
      requestId,
    };

    this.logger.error(
      `Http Status ${status} - Error: ${JSON.stringify(message)} - Path: ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : undefined,
      AllExceptionsFilter.name,
      correlationId,
    );

    response.status(status).json(errorResponse);
  }
}
