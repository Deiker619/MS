import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { TokensModule } from './tokens/tokens.module';
import { TwoFactorModule } from './two-factor/two-factor.module';
import { AuthModule } from './auth/auth.module';
import { NatsJetStreamModule } from './common/nats/nats-jetstream.module';
import { envSchema } from './config/envs';
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    UsersModule,
    TokensModule,
    TwoFactorModule,
    AuthModule,
    NatsJetStreamModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  constructor() {
    //console.log(envSchema);
  }
}
