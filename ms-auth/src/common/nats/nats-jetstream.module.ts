import { Module, Global } from '@nestjs/common';
import { NatsJetStreamService } from './nats-jetstream.service';

@Global()
@Module({
  providers: [NatsJetStreamService],
  exports: [NatsJetStreamService],
})
export class NatsJetStreamModule {}
