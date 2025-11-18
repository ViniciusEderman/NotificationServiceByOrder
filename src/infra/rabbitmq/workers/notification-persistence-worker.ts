import { injectable } from "tsyringe";
import amqp, { Connection, Channel } from "amqplib";
import { WinstonLogger } from "@/infra/logging/winston-logger";
import { NotificationRepository } from "@/domain/interfaces/notification-repository";
import { Result, AppError } from "@/shared/core/result";

interface MessageContent {
  id: string;
  tries: number;
  channel: string;
  status: string;
  externalId: string;
  recipient: {
    clientId: string;
    phoneNumber: string;
    name?: string;
  };
}

@injectable()
export class NotificationPersistenceWorker {
  private connection!: Connection;
  private channel!: Channel;

  private readonly PREFETCH = 5;
  private readonly QUEUE_NAME = process.env.PERSISTENCE_QUEUE || "notification-persistence-queue";
  private readonly amqpUrl: string = process.env.RABBITMQ_URL || "amqp://localhost:5672";
  
  constructor(
    private readonly logger: WinstonLogger,
    private readonly notificationRepository: NotificationRepository
  ) {}

  async startListening(): Promise<Result<void>> {
    try {
      const conn = await amqp.connect(this.amqpUrl);
      this.connection = conn as unknown as Connection;
      this.logger.info("notification-persistence-worker connected to RabbitMQ");

      const ch = await (this.connection as any).createChannel();
      this.channel = ch as Channel;

      await this.channel.prefetch(this.PREFETCH);

      this.logger.info(
        `notification-persistence-worker listening on queue: ${this.QUEUE_NAME}`
      );

      await this.channel.consume(this.QUEUE_NAME, (msg) =>
        this.handleMessage(msg)
      );

      this.connection.on("error", (err: Error) => {
        this.logger.error("notification-persistence-worker connection error", {
          error: err.message,
        });
      });

      this.connection.on("close", () => {
        this.logger.warn("notification-persistence-worker connection closed");
      });

      return Result.ok(undefined);
    } catch (error) {
      this.logger.error("failed to start notification-persistence-worker", {
        error: error instanceof Error ? error.message : String(error),
      });
      return Result.fail(
        new AppError(
          "WORKER_INITIALIZATION_ERROR",
          error instanceof Error ? error.message : "Unknown error"
        )
      );
    }
  }

  private async handleMessage(msg: amqp.Message | null): Promise<void> {
    if (!msg) {
      this.logger.warn("received null message, ignoring");
      return;
    }

    let content: MessageContent;
    try {
      content = JSON.parse(msg.content.toString()) as MessageContent;
    } catch (error) {
      this.logger.error("invalid message format", {
        error: error instanceof Error ? error.message : String(error),
      });
      this.channel.nack(msg, false, false);
      return;
    }

    const result = await this.notificationRepository.save(content as any);

    if (!result.isSuccess) {
      this.logger.error("failed to persist notification", {
        error: result.getError().message,
        notificationId: content.id,
      });
      this.channel.nack(msg, false, false);
      return;
    }

    this.channel.ack(msg);
    this.logger.info("notification persisted and acked", {
      notificationId: content.id,
    });
  }
}
