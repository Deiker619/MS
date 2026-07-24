import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { TokensModule } from './tokens/tokens.module';
import { TwoFactorModule } from './two-factor/two-factor.module';
import { AuthModule } from './auth/auth.module';
import { envSchema } from './config/envs';
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    UsersModule,
    TokensModule,
    TwoFactorModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  constructor() {
    //console.log(envSchema);
  }
}
