import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { TokensService, JwtPayload } from '../tokens/tokens.service';
import { TwoFactorService } from '../two-factor/two-factor.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokensService: TokensService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      email: dto.email,
      password: hashedPassword,
    });
    // Remove password from response
    const { password, ...result } = user;
    return result;
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    // Si el usuario tiene 2FA habilitado, solo emitimos un token temporal
    if (user.isTwoFactorEnabled) {
      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        roles: user.roles,
        isTwoFactorPassed: false, // Importante
      };

      return {
        accessToken: await this.tokensService.generateAccessToken(payload),
        message: 'Two-factor authentication required',
        isTwoFactorRequired: true,
      };
    }

    // Login normal sin 2FA
    return this.generateTokensForUser(user, false);
  }

  async generateTokensForUser(user: any, isTwoFactorPassed: boolean = false) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      isTwoFactorPassed,
    };

    const accessToken = await this.tokensService.generateAccessToken(payload);
    const refreshToken = await this.tokensService.generateRefreshToken(user.id);

    // Update lastLogin
    await this.usersService.update(user.id, { lastLogin: new Date() });

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async refreshTokens(userId: string, oldRefreshToken: string) {
    const user = await this.usersService.findById(userId);

    // Si llegamos aquí, el guard validó el refresh token via TokensService
    // Ahora debemos revocar el token anterior (rotación)
    await this.tokensService.revokeRefreshToken(userId, oldRefreshToken);

    // Generar nuevos tokens (asumimos que si está refrescando es porque pasó 2FA si lo tenía)
    return this.generateTokensForUser(user, true);
  }

  async logout(userId: string, accessTokenPayload: any) {
    // Revocar todos los refresh tokens (o podríamos revocar solo el que se usó, pero es más seguro revocar todos)
    await this.tokensService.revokeAllUserRefreshTokens(userId);

    // Añadir el accessToken actual a la blacklist
    if (
      accessTokenPayload &&
      accessTokenPayload.jti &&
      accessTokenPayload.exp
    ) {
      await this.tokensService.blacklistAccessToken(
        accessTokenPayload.jti,
        accessTokenPayload.exp,
      );
    }

    return { message: 'Logged out successfully' };
  }

  async verifyTwoFactor(userId: string, code: string) {
    const user = await this.usersService.findById(userId);

    if (!user.isTwoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException(
        'Two-factor authentication is not enabled for this user',
      );
    }

    const isCodeValid = this.twoFactorService.isTwoFactorCodeValid(
      code,
      user.twoFactorSecret,
    );

    if (!isCodeValid) {
      throw new UnauthorizedException('Wrong authentication code');
    }

    // Code is valid, generate full tokens
    return this.generateTokensForUser(user, true);
  }
}
