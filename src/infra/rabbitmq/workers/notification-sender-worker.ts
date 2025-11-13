import { injectable } from "tsyringe";
import amqp, { Connection, Channel } from "amqplib";
import { WinstonLogger } from "@/infra/logging/winston-logger";
import { SendNotificationUseCase } from "@/domain/application/use-cases/notification-use-case";
import { NotificationEvent } from "@/domain/application/dtos/notification-event.dto";

@injectable()
export class NotificationSenderWorker {
  private connection!: Connection;
  private channel!: Channel;
  private readonly QUEUE_NAME = process.env.INCOMING_QUEUE || "orders";
  private readonly PREFETCH = 1;
  private readonly amqpUrl: string =
    process.env.RABBITMQ_URL || "amqp://localhost:5672";

  constructor(
    private readonly logger: WinstonLogger,
    private readonly sendNotificationUseCase: SendNotificationUseCase
  ) {}

  async startListening(): Promise<void> {
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

      await this.channel.consume(
        this.QUEUE_NAME,
        async (msg: amqp.Message | null) => {
          if (msg) {
            try {
              const content = JSON.parse(
                msg.content.toString()
              ) as NotificationEvent;

              const result = await this.sendNotificationUseCase.execute(content);

              if (!result.isSuccess) {
                this.logger.error(
                  "failed to process notification from queue",
                  {
                    error: result.getError().message,
                    clientId: content.clientId,
                  }
                );
                this.channel.nack(msg, false, false);
                return;
              }

              this.channel.ack(msg);
              this.logger.info("notification processed successfully", {
                notificationId: result.getValue().id.toString(),
              });
            } catch (error) {
              this.logger.error("error processing message in sender worker", {
                error: error instanceof Error ? error.message : String(error),
              });
              this.channel.nack(msg, false, true);
            }
          }
        }
      );

      this.connection.on("error", (err: Error) => {
        this.logger.error("notification-sender-worker connection error", {
          error: err.message,
        });
      });

      this.connection.on("close", () => {
        this.logger.warn("notification-sender-worker connection closed");
      });
    } catch (error) {
      this.logger.error("failed to start notification-sender-worker", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
