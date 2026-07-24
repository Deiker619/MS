import { Module } from '@nestjs/common';
import { NatsJetStreamListenerService } from './nats-jetstream-listener.service';
import { LogsModule } from '../../logs/logs.module';

@Module({
  imports: [LogsModule],
  providers: [NatsJetStreamListenerService],
})
export class NatsJetStreamConsumerModule {}
