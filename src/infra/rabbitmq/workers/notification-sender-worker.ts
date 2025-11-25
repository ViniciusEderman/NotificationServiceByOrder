import { injectable } from "tsyringe";
import amqp from "amqplib";
import { SendNotificationUseCase } from "@/domain/application/use-cases/notification-use-case";
import { NotificationDispatcher } from "@/domain/application/use-cases/notification-dispatcher-use-case";
import { Logger } from "@/domain/interfaces/logger";
import { WorkerBase } from "@/infra/rabbitmq/workers/base-worker";
import { AppError, Result } from "@/shared/core/result";

@injectable()
export class NotificationSenderWorker extends WorkerBase {
  constructor(
    logger: Logger,
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly dispatcher: NotificationDispatcher
  ) {
    super(
      logger,
      process.env.RABBITMQ_URL!,
      process.env.INCOMING_QUEUE!,
      "notification-sender-worker",
      1
    );
  }

  protected async handleMessage(msg: amqp.Message | null): Promise<Result<void>> {
    if (!msg) return Result.fail(new AppError("WORKER_ERROR", "received null message"));

    const raw = JSON.parse(msg.content.toString());

    const event = {
      clientId: raw.clientId,
      externalId: raw.externalId ?? raw.id ?? raw.orderId,
      status: raw.status,
      channel: raw.channel,
      tries: raw.tries,
    };

    const result = await this.sendNotificationUseCase.execute(event);

    if (!result.isSuccess) {
      this.channel.nack(msg, false, false);
      return Result.fail(new AppError("WORKER_ERROR", "failed to send notification"));
    }

    try {
      await this.dispatcher.execute(result.getValue());
      this.channel.ack(msg);

      return Result.ok(undefined);
    } catch (e) {
      this.logger.error("error processing message", {
        error: e instanceof Error ? e.message : String(e),
      })
      this.channel.nack(msg, false, true);
      return Result.fail(new AppError("WORKER_ERROR", "failed to dispatch notification"));
    }
  }
}
