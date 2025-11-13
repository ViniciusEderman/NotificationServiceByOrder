import { injectable } from "tsyringe";
import amqp, { Connection, Channel } from "amqplib";
import { WinstonLogger } from "@/infra/logging/winston-logger";
import { NotificationRepository } from "@/domain/interfaces/notification-repository";

interface MessageContent {
  id: string;
  channel: string;
  status: string;
  tries: number;
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

  async startListening(): Promise<void> {
    try {
      const conn = await amqp.connect(this.amqpUrl);
      this.connection = conn as unknown as Connection;
      this.logger.info("notification-persistence-worker connected to RabbitMQ");

      const ch = await (this.connection as any).createChannel();
      this.channel = ch as Channel;
      await this.channel.prefetch(this.PREFETCH);

      await this.channel.assertQueue(this.QUEUE_NAME, {
        durable: true,
        arguments: {
          "x-message-ttl": 10000,
        },
      });

      this.logger.info(
        `notification-persistence-worker listening on queue: ${this.QUEUE_NAME}`
      );

      await this.channel.consume(
        this.QUEUE_NAME,
        async (msg: amqp.Message | null) => {
          if (msg) {
            try {
              const content = JSON.parse(
                msg.content.toString()
              ) as MessageContent;

              const result = await this.notificationRepository.save(content as any); // ANALISE ESSA TYPAGEM

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
            } catch (error) {
              this.logger.error(
                "error processing message in persistence worker",
                {
                  error: error instanceof Error ? error.message : String(error),
                }
              );
              this.channel.nack(msg, false, false);
            }
          }
        }
      );

      this.connection.on("error", (err: Error) => {
        this.logger.error("notification-persistence-worker connection error", {
          error: err.message,
        });
      });

      this.connection.on("close", () => {
        this.logger.warn("notification-persistence-worker connection closed");
      });
    } catch (error) {
      this.logger.error("failed to start notification-persistence-worker", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
