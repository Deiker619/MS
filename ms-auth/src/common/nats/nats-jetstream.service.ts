import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  connect,
  NatsConnection,
  StringCodec,
  RetentionPolicy,
  StorageType,
} from 'nats';
import { randomUUID } from 'crypto';
import { BaseEventPayload, NATS_STREAMS } from '@app/events';

@Injectable()
export class NatsJetStreamService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NatsJetStreamService.name);
  private nc: NatsConnection;
  private codec = StringCodec();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const natsUrl = this.configService.get<string>('NATS_URL') || 'nats://localhost:4222';
    try {
      this.logger.log(`Connecting to NATS JetStream at ${natsUrl}...`);
      this.nc = await connect({ servers: natsUrl });
      this.logger.log('Connected to NATS Server successfully.');

      await this.ensureStreamsExist();
    } catch (error) {
      this.logger.error(`Failed to connect or initialize NATS JetStream: ${error.message}`, error.stack);
    }
  }

  async onModuleDestroy() {
    if (this.nc) {
      await this.nc.drain();
      await this.nc.close();
      this.logger.log('NATS Connection closed gracefully.');
    }
  }

  private async ensureStreamsExist() {
    try {
      const jsm = await this.nc.jetstreamManager();

      const authStreamConfig = NATS_STREAMS.AUTH_EVENTS;
      try {
        await jsm.streams.info(authStreamConfig.name);
        this.logger.log(`JetStream Stream [${authStreamConfig.name}] already exists.`);
      } catch {
        this.logger.log(`Stream [${authStreamConfig.name}] not found. Checking for overlapping streams...`);

        // Check if another stream already controls any of the target subjects
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
          max_msgs: -1,
          max_bytes: -1,
          max_age: 0,
        });
        this.logger.log(`JetStream Stream [${authStreamConfig.name}] created successfully.`);
      }
    } catch (error) {
      this.logger.error(`Error ensuring JetStream streams: ${error.message}`);
    }
  }

  /**
   * Publishes a business event payload wrapped in a standard event envelope.
   */
  async publishEvent<T>(
    subject: string,
    data: T,
    options?: {
      userId?: string;
      correlationId?: string;
      application?: string;
      ip?: string;
      userAgent?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<BaseEventPayload<T> | null> {
    if (!this.nc) {
      this.logger.warn(`Cannot publish event '${subject}': NATS connection is not established.`);
      return null;
    }

    const payload: BaseEventPayload<T> = {
      eventId: randomUUID(),
      eventType: subject,
      timestamp: new Date().toISOString(),
      producer: 'ms-auth',
      correlationId: options?.correlationId,
      userId: options?.userId,
      application: options?.application || 'ms-auth',
      ip: options?.ip,
      userAgent: options?.userAgent,
      data,
      metadata: options?.metadata,
    };

    try {
      const js = this.nc.jetstream();
      const pubAck = await js.publish(
        subject,
        this.codec.encode(JSON.stringify(payload)),
        { timeout: 2500 },
      );

      this.logger.log(
        `[JetStream] Published '${subject}' | Stream: ${pubAck.stream} | Seq: ${pubAck.seq} | EventID: ${payload.eventId}`,
      );

      return payload;
    } catch (error) {
      this.logger.error(`Failed to publish event '${subject}' to NATS JetStream: ${error.message}`);
      return payload;
    }
  }
}
