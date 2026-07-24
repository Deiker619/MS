import { Module, Global } from '@nestjs/common';
import { AppLoggerService } from './logger/logger.service';

@Global()
@Module({
  providers: [AppLoggerService],
  exports: [AppLoggerService],
})
export class SharedModule {}
