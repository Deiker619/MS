import { Injectable, LoggerService, Scope } from '@nestjs/common';

export interface StructuredLog {
  timestamp: string;
  level: string;
  message: string;
  context?: string;
  correlationId?: string;
  requestId?: string;
  trace?: string;
  metadata?: Record<string, any>;
}

@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService implements LoggerService {
  private context?: string;

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, context?: string, correlationId?: string) {
    this.printLog('INFO', message, context, correlationId);
  }

  error(message: any, trace?: string, context?: string, correlationId?: string) {
    this.printLog('ERROR', message, context, correlationId, trace);
  }

  warn(message: any, context?: string, correlationId?: string) {
    this.printLog('WARN', message, context, correlationId);
  }

  debug(message: any, context?: string, correlationId?: string) {
    this.printLog('DEBUG', message, context, correlationId);
  }

  verbose(message: any, context?: string, correlationId?: string) {
    this.printLog('VERBOSE', message, context, correlationId);
  }

  private printLog(
    level: string,
    message: any,
    context?: string,
    correlationId?: string,
    trace?: string,
  ) {
    const payload: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      message: typeof message === 'object' ? JSON.stringify(message) : message,
      context: context || this.context || 'API-Gateway',
      correlationId,
      trace,
    };

    const output = JSON.stringify(payload);
    if (level === 'ERROR') {
      process.stderr.write(`${output}\n`);
    } else {
      process.stdout.write(`${output}\n`);
    }
  }
}
