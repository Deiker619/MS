import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppLoggerService } from './shared/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = await app.resolve(AppLoggerService);
  logger.setContext('Bootstrap');

  // Security Middlewares
  app.use(helmet());
  app.enableCors({
    origin: true, // Configurable per domain in production
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Enable Graceful Shutdown Hooks for Kubernetes / Docker container lifecycle
  app.enableShutdownHooks();

  // API Prefix & URI Versioning (/api/v1/...)
  const globalPrefix = configService.get<string>('app.apiPrefix', 'api');
  const defaultVersion = configService.get<string>('app.apiVersion', '1');

  app.setGlobalPrefix(globalPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion,
  });

  // Global DTO Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = configService.get<number>('app.port', 3000);
  await app.listen(port);

  logger.log(
    `🚀 Fintech API Gateway running on http://localhost:${port}/${globalPrefix}/v${defaultVersion}`,
  );
}

bootstrap();
