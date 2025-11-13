import { injectable } from "tsyringe";
import amqp, { Connection, Channel } from "amqplib";
import { NotificationGateway } from "@/domain/interfaces/queue";
import { DomainNotification } from "@/domain/enterprise/entities/notification";
import { WinstonLogger } from "@/infra/logging/winston-logger";
import { AppError, Result } from "@/shared/core/result";

@injectable()
export class Rabbit implements NotificationGateway {
  private connection!: Connection;
  private channel!: Channel;
  private readonly RETRY_QUEUE = "notification-retry-queue"; // adicionar env
  private readonly CREATE_QUEUE = "notification-create-queue"; // adicionar env
  private readonly RETRY_QUEUE_TTL = 600000;
  private readonly CREATE_QUEUE_TTL = 10000;
  private readonly amqpUrl: string =
    process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";

  constructor(private readonly logger: WinstonLogger) {}

  private async ensureConnection(): Promise<void> {
    if (!this.connection || !this.channel) {
      try {
        const conn = await amqp.connect(this.amqpUrl);
        this.connection = conn as unknown as Connection;

        const ch = await (this.connection as any).createChannel();
        this.channel = ch as Channel;

        if (!this.channel) {
          throw new Error("failed to create channel");
        }

        this.logger.info("rabbitMQ gateway connected");
      } catch (error) {
        this.logger.error("failed to connect to RabbitMQ", {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }
  }

  async publishToRetry(
    notification: DomainNotification
  ): Promise<Result<void>> {
    try {
      await this.ensureConnection();

      if (!this.channel) {
        throw new Error("channel is not available");
      }

      await this.channel.assertQueue(this.RETRY_QUEUE, {
        durable: true,
        arguments: {
          "x-dead-letter-routing-key": "notification.main",
          "x-message-ttl": this.RETRY_QUEUE_TTL,
        },
      });

      const message = {
        id: notification.id.toString(),
        status: notification.status,
        channel: notification.channel,
        tries: notification.tries,
        recipient: {
          clientId: notification.recipient.clientId,
          phoneNumber: notification.recipient.phoneNumber,
          name: notification.recipient.name,
        },
      };

      const published = this.channel.sendToQueue(
        this.RETRY_QUEUE,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );

      if (!published) {
        return Result.fail(
          new AppError(
            "RABBITMQ_PUBLISH_FAILED",
            "failed to publish retry notification to queue"
          )
        );
      }

      this.logger.info("notification published to retry queue", {
        notificationId: notification.id.toString(),
      });

      return Result.ok(undefined);
    } catch (error) {
      this.logger.error("error publishing to retry queue", {
        error: error instanceof Error ? error.message : String(error),
      });

      return Result.fail(
        new AppError(
          "RABBITMQ_PUBLISH_ERROR",
          error instanceof Error ? error.message : String(error)
        )
      );
    }
  }

  async publishToCreate(
    notification: DomainNotification
  ): Promise<Result<void>> {
    try {
      await this.ensureConnection();

      if (!this.channel) {
        throw new Error("channel is not available");
      }

      await this.channel.assertQueue(this.CREATE_QUEUE, {
        durable: true,
        arguments: {
          "x-message-ttl": this.CREATE_QUEUE_TTL,
        },
      });

      const message = {
        id: notification.id.toString(),
        status: notification.status,
        channel: notification.channel,
        tries: notification.tries,
        recipient: {
          clientId: notification.recipient.clientId,
          phoneNumber: notification.recipient.phoneNumber,
          name: notification.recipient.name,
        },
      };

      const published = this.channel.sendToQueue(
        this.CREATE_QUEUE,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );

      if (!published) {
        return Result.fail(
          new AppError(
            "RABBITMQ_PUBLISH_FAILED",
            "failed to publish create notification to queue"
          )
        );
      }

      this.logger.info("notification published to create queue", {
        notificationId: notification.id.toString(),
      });

      return Result.ok(undefined);
    } catch (error) {
      this.logger.error("error publishing to create queue", {
        error: error instanceof Error ? error.message : String(error),
      });

      return Result.fail(
        new AppError(
          "RABBITMQ_PUBLISH_ERROR",
          error instanceof Error ? error.message : String(error)
        )
      );
    }
  }
}
