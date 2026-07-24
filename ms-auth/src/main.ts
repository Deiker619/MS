import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Setup TCP Microservice
  const tcpPort = configService.get<number>('TCP_PORT') || 3001;
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: tcpPort,
    },
  });

  // Start microservices and HTTP server
  await app.startAllMicroservices();

  const httpPort = configService.get<number>('APP_PORT') || 3000;
  await app.listen(httpPort);
  console.log(`HTTP Server running on port: ${httpPort}`);
  console.log(`TCP Microservice running on port: ${tcpPort}`);
}
bootstrap();
