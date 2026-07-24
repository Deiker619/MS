import { Module } from '@nestjs/common';
import { TwoFactorService } from './two-factor.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [TwoFactorService],
  exports: [TwoFactorService],
})
export class TwoFactorModule {}
