import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Configure NATS Microservice Transport
  const natsServers = configService.get<string[]>('nats.servers') || ['nats://localhost:4222'];
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: natsServers,
      queue: 'ms_logs_queue', // Load balance across multiple instances of ms-logs
    },
  });

  // Start microservice listeners
  await app.startAllMicroservices();
  logger.log(`NATS Microservice listening on servers: ${natsServers.join(', ')}`);

  // Start HTTP Server
  const httpPort = configService.get<number>('port') || 3002;
  await app.listen(httpPort);
  logger.log(`HTTP Log Query Server running on port: ${httpPort}`);
}

bootstrap();
