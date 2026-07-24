import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthTcpController } from './auth.controller.tcp';
import { UsersModule } from '../users/users.module';
import { TokensModule } from '../tokens/tokens.module';
import { TwoFactorModule } from '../two-factor/two-factor.module';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    UsersModule,
    TokensModule,
    TwoFactorModule,
    PassportModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController, AuthTcpController],
  providers: [AuthService, LocalStrategy, JwtStrategy, JwtRefreshStrategy],
})
export class AuthModule {}
