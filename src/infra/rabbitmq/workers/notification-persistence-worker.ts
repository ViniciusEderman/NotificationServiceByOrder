import { injectable } from "tsyringe";
import amqp from "amqplib";
import { Logger } from "@/domain/interfaces/logger";
import { NotificationRepository } from "@/domain/interfaces/notification-repository";
import { WorkerBase } from "@/infra/rabbitmq/workers/base-worker";
import { AppError, Result } from "@/shared/core/result";

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
export class NotificationPersistenceWorker extends WorkerBase {
  constructor(
    logger: Logger,
    private readonly notificationRepository: NotificationRepository
  ) {
    super(
      logger,
      process.env.RABBITMQ_URL!,
      process.env.PERSISTENCE_QUEUE!,
      "notification-persistence-worker",
      5
    );
  }

  protected async handleMessage(msg: amqp.Message | null): Promise<Result<void>> {
    if (!msg) return Result.fail(new AppError("WORKER_ERROR", "received null message"));

    let payload: MessageContent;

    try {
      this.logger.info("parsing message content", {
        content: msg.content.toString(),
      });

      payload = JSON.parse(msg.content.toString());
    } 
    catch (e) {
      this.logger.error("Failed to parse message content", {
        error: e instanceof Error ? e.message : String(e),
      });

      this.channel.nack(msg, false, false);
      return Result.fail(new AppError("WORKER_ERROR", "failed to parse message content"));
    }

    const result = await this.notificationRepository.save(payload as any);

    if (!result.isSuccess) {
      this.channel.nack(msg, false, false);
      return Result.fail(new AppError("WORKER_ERROR", "failed to persist notification"));
    }

    this.channel.ack(msg);
    return Result.ok(undefined);
  }
}
