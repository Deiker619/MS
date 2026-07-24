import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  connect,
  NatsConnection,
  StringCodec,
  AckPolicy,
  RetentionPolicy,
  StorageType,
  consumerOpts,
  createInbox,
} from 'nats';
import { LogsService } from '../../logs/logs.service';
import { NATS_STREAMS, BaseEventPayload } from '@app/events';

@Injectable()
export class NatsJetStreamListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NatsJetStreamListenerService.name);
  private nc: NatsConnection;
  private codec = StringCodec();

  constructor(
    private readonly configService: ConfigService,
    private readonly logsService: LogsService,
  ) {}

  async onModuleInit() {
    const natsUrl =
      this.configService.get<string>('NATS_SERVERS') ||
      this.configService.get<string>('NATS_URL') ||
      'nats://localhost:4222';

    try {
      this.logger.log(`Connecting to NATS JetStream at ${natsUrl}...`);
      this.nc = await connect({ servers: natsUrl });
      this.logger.log('Connected to NATS Server successfully.');

      await this.ensureStreamsExist();
      await this.startListening();
    } catch (error) {
      this.logger.error(`Failed to initialize NATS JetStream Listener: ${error.message}`, error.stack);
    }
  }

  async onModuleDestroy() {
    if (this.nc) {
      await this.nc.drain();
      await this.nc.close();
      this.logger.log('NATS Listener connection closed.');
    }
  }

  private async ensureStreamsExist() {
    try {
      const jsm = await this.nc.jetstreamManager();
      const authStreamConfig = NATS_STREAMS.AUTH_EVENTS;

      try {
        await jsm.streams.info(authStreamConfig.name);
        this.logger.log(`Stream [${authStreamConfig.name}] confirmed.`);
      } catch {
        this.logger.log(`Stream [${authStreamConfig.name}] does not exist. Checking for overlapping streams...`);

        for (const subject of authStreamConfig.subjects) {
          try {
            const existingStream = await jsm.streams.find(subject);
            if (existingStream && existingStream !== authStreamConfig.name) {
              this.logger.warn(
                `Stream [${existingStream}] overlaps with subject '${subject}'. Removing stale stream...`,
              );
              await jsm.streams.delete(existingStream);
            }
          } catch {
            // Subject is not assigned to any existing stream
          }
        }

        await jsm.streams.add({
          name: authStreamConfig.name,
          subjects: [...authStreamConfig.subjects],
          retention: RetentionPolicy.Limits,
          storage: StorageType.File,
        });
        this.logger.log(`Stream [${authStreamConfig.name}] created.`);
      }
    } catch (error) {
      this.logger.error(`Error checking/creating JetStream streams: ${error.message}`);
    }
  }

  private async startListening() {
    try {
      const js = this.nc.jetstream();
      const streamName = NATS_STREAMS.AUTH_EVENTS.name;
      const durableName = 'ms-logs-audit-consumer';
      const subjectPattern = 'auth.user.>';

      this.logger.log(
        `Subscribing to Stream [${streamName}] | Pattern [${subjectPattern}] | Durable Consumer [${durableName}]`,
      );

      const createSubscriptionOpts = () => {
        const opts = consumerOpts();
        opts.durable(durableName);
        opts.manualAck();
        opts.ackExplicit();
        opts.deliverTo(createInbox());
        return opts;
      };

      let sub;
      try {
        sub = await js.subscribe(subjectPattern, createSubscriptionOpts());
      } catch (err) {
        this.logger.warn(`Initial subscription attempt failed: ${err.message}. Attempting durable consumer reset...`);
        try {
          const jsm = await this.nc.jetstreamManager();
          await jsm.consumers.delete(streamName, durableName);
          this.logger.log(`Existing durable consumer [${durableName}] deleted from stream [${streamName}].`);
        } catch (deleteErr) {
          this.logger.warn(`Could not delete consumer [${durableName}]: ${deleteErr.message}`);
        }
        sub = await js.subscribe(subjectPattern, createSubscriptionOpts());
      }

      (async () => {
        for await (const msg of sub) {
          try {
            const rawData = this.codec.decode(msg.data);
            const payload: BaseEventPayload<any> = JSON.parse(rawData);

            await this.logsService.processDomainEvent(payload);

            // Explicit Manual ACK
            msg.ack();
          } catch (error) {
            this.logger.error(
              `Error processing event from subject '${msg.subject}': ${error.message}. NACKing message for redelivery.`,
            );
            msg.nak(3000); // Redeliver after 3 seconds
          }
        }
      })();
    } catch (error) {
      this.logger.error(`Failed to start NATS JetStream subscription: ${error.message}`, error.stack);
    }
  }
}

