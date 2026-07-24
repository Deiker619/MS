import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  isTwoFactorPassed?: boolean;
}

@Injectable()
export class TokensService {
  private readonly redisClient: Redis;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: this.configService.get<number>('REDIS_PORT'),
    });
  }

  async generateAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET', 'secret'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES', '15m') as any,
      jwtid: uuidv4(),
    });
  }

  async generateRefreshToken(userId: string): Promise<string> {
    const payload = { sub: userId };
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES') as any,
      jwtid: uuidv4(),
    });

    // Hash refresh token before storing in Redis
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    // 7 days in seconds
    const expiresIn = 7 * 24 * 60 * 60;

    // Store with prefix
    await this.redisClient.set(
      `refresh_token:${userId}:${refreshToken}`,
      hashedToken,
      'EX',
      expiresIn,
    );

    return refreshToken;
  }

  async validateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const redisKey = `refresh_token:${userId}:${refreshToken}`;
    const hashedToken = await this.redisClient.get(redisKey);

    if (!hashedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const isMatch = await bcrypt.compare(refreshToken, hashedToken);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return true;
  }

  async revokeRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    await this.redisClient.del(`refresh_token:${userId}:${refreshToken}`);
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    const keys = await this.redisClient.keys(`refresh_token:${userId}:*`);
    if (keys.length > 0) {
      await this.redisClient.del(...keys);
    }
  }

  async blacklistAccessToken(jti: string, exp: number): Promise<void> {
    const currentTime = Math.floor(Date.now() / 1000);
    const timeToLive = exp - currentTime;

    if (timeToLive > 0) {
      await this.redisClient.set(`blacklist:${jti}`, 'true', 'EX', timeToLive);
    }
  }

  async isAccessTokenBlacklisted(jti: string): Promise<boolean> {
    const isBlacklisted = await this.redisClient.get(`blacklist:${jti}`);
    return !!isBlacklisted;
  }
}
