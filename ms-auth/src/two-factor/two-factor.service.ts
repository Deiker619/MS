import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import * as crypto from 'crypto';

@Injectable()
export class TwoFactorService {
  private readonly algorithm = 'aes-256-cbc';

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  // Key should be exactly 32 bytes (256 bits)
  private getEncryptionKey(): Buffer {
    const secret = this.configService.get<string>('APP_SECRET', '');
    return crypto.scryptSync(secret, 'salt', 32);
  }

  private encryptSecret(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.getEncryptionKey(),
      iv,
    );
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  private decryptSecret(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.getEncryptionKey(),
      iv,
    );
    let decrypted = decipher.update(encryptedText, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  public async generateTwoFactorSecret(userEmail: string) {
    const secret = speakeasy.generateSecret({
      name: `MS-Auth (${userEmail})`,
    });

    const encryptedSecret = this.encryptSecret(secret.base32);
    return {
      secret: encryptedSecret, // we'll save this in DB
      base32Secret: secret.base32, // plaintext secret for manual entry
      otpauthUrl: secret.otpauth_url,
    };
  }

  public async generateQrCodeDataURL(otpAuthUrl: string): Promise<string> {
    return qrcode.toDataURL(otpAuthUrl);
  }

  public async setTwoFactorSecret(
    userId: string,
    encryptedSecret: string,
  ) {
    return this.usersService.update(userId, {
      twoFactorSecret: encryptedSecret,
    });
  }

  public async enableTwoFactorAuthentication(userId: string) {
    return this.usersService.update(userId, {
      isTwoFactorEnabled: true,
    });
  }

  public async turnOffTwoFactorAuthentication(userId: string) {
    return this.usersService.update(userId, {
      twoFactorSecret:  '',
      isTwoFactorEnabled: false,
    });
  }

  public isTwoFactorCodeValid(
    twoFactorCode: string,
    encryptedSecret: string,
  ): boolean {
    const decryptedSecret = this.decryptSecret(encryptedSecret);
    return speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: twoFactorCode,
    });
  }
}
