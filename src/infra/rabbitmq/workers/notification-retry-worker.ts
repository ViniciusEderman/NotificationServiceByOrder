import { inject, injectable } from "tsyringe";
import amqp, { Connection, Channel } from "amqplib";
import { WinstonLogger } from "@/infra/logging/winston-logger";
import { AppError, Result } from "@/shared/core/result";
import { NotificationDispatcher } from "@/domain/application/use-cases/notification-dispatcher-use-case";
import {
  NotificationMapper,
  NotificationQueuePayload,
} from "@/domain/application/mappers/notification-mapper";

@injectable()
export class NotificationRetryWorker {
  private connection!: Connection;
  private channel!: Channel;
  private readonly amqpUrl: string =
    process.env.RABBITMQ_URL || "amqp://localhost:5672";
  private readonly RETRY_QUEUE =
    process.env.RETRY_QUEUE || "notification-retry-queue";

  constructor(
    private readonly logger: WinstonLogger,
    private notificationMapper: NotificationMapper,
    private dispatcher: NotificationDispatcher
  ) {}

  async startListening(): Promise<Result<void>> {
    try {
      const conn = await amqp.connect(this.amqpUrl);
      this.connection = conn as unknown as Connection;
      this.logger.info("notification-persistence-worker connected to RabbitMQ");

      const ch = await (this.connection as any).createChannel();
      this.channel = ch as Channel;

      this.logger.info(
        `notification-persistence-worker listening on queue: ${this.RETRY_QUEUE}`
      );

      await this.channel.consume(this.RETRY_QUEUE, (msg) =>
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

    try {
      const raw = JSON.parse(
        msg.content.toString()
      ) as NotificationQueuePayload;

      const notificationMapperResult = await this.notificationMapper.execute(raw);
      const sendResult = await this.dispatcher.execute(
        notificationMapperResult
      );

      if (!sendResult.isSuccess) {
        this.logger.error("Failed to dispatch notification on retry", {
          error: sendResult.getError(),
        });
        this.channel.nack(msg, false, false);
        return;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(
        "Error during notification retry dispatch or rehydration",
        { error: errorMessage }
      );
      this.channel.nack(msg, false, true);
    }
  }
}
