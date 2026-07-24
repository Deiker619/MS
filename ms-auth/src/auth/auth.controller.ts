import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, VerifyTwoFactorDto } from './dto/auth.dto';
import { LocalAuthGuard } from '../common/guards/local-auth.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtRefreshGuard } from '../common/guards/jwt-refresh.guard';
import { Jwt2FAPendingGuard } from '../common/guards/jwt-2fa.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { TwoFactorService } from '../two-factor/two-factor.service';
import { User } from '../users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@CurrentUser() user: User) {
    return this.authService.login(user);
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Req() req: any) {
    // req.user viene seteado por el JwtRefreshStrategy con { userId, refreshToken }
    return this.authService.refreshTokens(
      req.user.userId,
      req.user.refreshToken,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: User, @Req() req: any) {
    // req.user tiene el payload del token (incluyendo jti y exp) gracias al JwtStrategy
    return this.authService.logout(user.id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentUser() user: User) {
    const { password, twoFactorSecret, ...result } = user as any;
    return result;
  }

  // --- Two Factor Endpoints ---

  @UseGuards(JwtAuthGuard)
  @Post('2fa/generate')
  async register2FA(@CurrentUser() user: User) {
    const { otpauthUrl, secret, base32Secret } =
      await this.twoFactorService.generateTwoFactorSecret(user.email);
    if (!otpauthUrl || !secret) {
      throw new InternalServerErrorException('Failed to generate 2FA secret');
    }
    const qrCodeUrl =
      await this.twoFactorService.generateQrCodeDataURL(otpauthUrl);

    await this.twoFactorService.setTwoFactorSecret(user.id, secret);

    return {
      qrCodeUrl,
      secret: base32Secret, // This is the plain base32 key for Google Authenticator
      message:
        'Scan the QR code with Google Authenticator and call /2fa/enable with the code to activate',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  async turnOnTwoFactorAuthentication(
    @CurrentUser() user: User,
    @Body() body: VerifyTwoFactorDto,
  ) {
    if (!user.twoFactorSecret) {
      return { message: 'Must generate 2FA secret first' };
    }

    const isCodeValid = this.twoFactorService.isTwoFactorCodeValid(
      body.code,
      user.twoFactorSecret,
    );

    if (!isCodeValid) {
      throw new UnauthorizedException('Wrong authentication code');
    }

    await this.twoFactorService.enableTwoFactorAuthentication(user.id);
    return { message: '2FA has been enabled' };
  }

  // This endpoint uses Jwt2FAPendingGuard because they are half-logged in
  @UseGuards(Jwt2FAPendingGuard)
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  async verifyTwoFactor(
    @CurrentUser() user: User,
    @Body() body: VerifyTwoFactorDto,
  ) {
    return this.authService.verifyTwoFactor(user.id, body.code);
  }
}
