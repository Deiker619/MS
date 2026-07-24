import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { envSchema } from './envs';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envSchema,
    }),
  ],
})
export class ConfigModule {}
