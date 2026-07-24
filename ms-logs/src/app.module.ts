import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import configuration from './config/configuration';
import { LogsModule } from './logs/logs.module';
import { Log } from './logs/entities/log.entity';
import { NatsJetStreamConsumerModule } from './common/nats/nats-jetstream-consumer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        return {
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          entities: [Log],
          migrations: [join(__dirname, 'database', 'migrations', '*.{ts,js}')],
          migrationsRun: true, // Automatically run pending migrations on startup
          synchronize: false,
        };
      },
    }),
    LogsModule,
    NatsJetStreamConsumerModule,
  ],
})
export class AppModule {}
