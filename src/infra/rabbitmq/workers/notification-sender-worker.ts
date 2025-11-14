import { injectable } from "tsyringe";
import amqp, { Connection, Channel } from "amqplib";
import { WinstonLogger } from "@/infra/logging/winston-logger";
import { SendNotificationUseCase } from "@/domain/application/use-cases/notification-use-case";
import { NotificationDispatcher } from "@/domain/application/use-cases/notification-dispatcher-use-case";
import { NotificationEvent } from "@/domain/application/dtos/notification-event.dto";
import { Result, AppError } from "@/shared/core/result";

@injectable()
export class NotificationSenderWorker {
  private connection!: Connection;
  private channel!: Channel;
  private readonly QUEUE_NAME = process.env.INCOMING_QUEUE || "orders";
  private readonly PREFETCH = 1;
  private readonly amqpUrl: string = process.env.RABBITMQ_URL || "amqp://localhost:5672";

  constructor(
    private readonly logger: WinstonLogger,
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly dispatcher: NotificationDispatcher
  ) {}

  async startListening(): Promise<Result<void>> {
    try {
      const conn = await amqp.connect(this.amqpUrl);
      this.connection = conn as unknown as Connection;
      this.logger.info("notification-sender-worker connected to RabbitMQ");

      const ch = await (this.connection as any).createChannel();
      this.channel = ch as Channel;
      await this.channel.prefetch(this.PREFETCH);

      await this.channel.assertQueue(this.QUEUE_NAME, {
        durable: true,
      });

      this.logger.info(
        `notification-sender-worker listening on queue: ${this.QUEUE_NAME}`
      );

      await this.channel.consume(this.QUEUE_NAME, (msg) =>
        this.handleMessage(msg)
      );

      this.connection.on("error", (err: Error) => {
        this.logger.error("notification-sender-worker connection error", {
          error: err.message,
        });
      });

      this.connection.on("close", () => {
        this.logger.warn("notification-sender-worker connection closed");
      });

      return Result.ok(undefined);
    } catch (error) {
      this.logger.error("failed to start notification-sender-worker", {
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

    const raw = JSON.parse(msg.content.toString()) as any;

    const event: NotificationEvent = {
      clientId: raw.clientId,
      externalId: raw.externalId ?? raw.id ?? raw.orderId,
      status: raw.status,
      channel: raw.channel,
      tries: raw.tries,
    };

    const createResult = await this.sendNotificationUseCase.execute(event);

    if (!createResult.isSuccess) {
      this.logger.error("failed to create notification from queue event", {
        error: createResult.getError().message,
        clientId: event.clientId,
      });
      this.channel.nack(msg, false, false);
      return;
    }

    const notification = createResult.getValue();

    try {
      await this.dispatcher.execute(notification);
      this.channel.ack(msg);
      this.logger.info("notification processed successfully", {
        notificationId: notification.id.toString(),
      });
    } catch (error) {
      this.logger.error("dispatcher error", {
        error: error instanceof Error ? error.message : String(error),
      });
      this.channel.nack(msg, false, true);
    }
  }
}
