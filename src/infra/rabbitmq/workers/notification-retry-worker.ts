import { injectable } from "tsyringe";
import amqp from "amqplib";
import { NotificationDispatcher } from "@/domain/application/use-cases/notification-dispatcher-use-case";
import { NotificationMapper } from "@/domain/application/mappers/notification-mapper";
import { Logger } from "@/domain/interfaces/logger";
import { WorkerBase } from "@/infra/rabbitmq/workers/base-worker";
import { AppError, Result } from "@/shared/core/result";

@injectable()
export class NotificationRetryWorker extends WorkerBase {
  constructor(
    logger: Logger,
    private notificationMapper: NotificationMapper,
    private dispatcher: NotificationDispatcher
  ) {
    super(
      logger,
      process.env.RABBITMQ_URL!,
      process.env.RETRY_QUEUE!,
      "notification-retry-worker"
    );
  }

  protected async handleMessage(msg: amqp.Message | null): Promise<Result<void>> {
    if (!msg) return Result.fail(new AppError("WORKER_ERROR", "received null message"));

    try {
      const raw = JSON.parse(msg.content.toString());
      const entity = await this.notificationMapper.execute(raw);
      const result = await this.dispatcher.execute(entity);

      if (!result.isSuccess) {
        this.channel.nack(msg, false, false);
        return Result.fail(new AppError("WORKER_ERROR", "failed to dispatcher notification"));
      }

      this.channel.ack(msg);
      return Result.ok(undefined);
    } 
    catch (e) {
      this.logger.error("error processing retry message", {
        error: e instanceof Error ? e.message : String(e),
      });
      
      this.channel.nack(msg, false, true);
      return Result.ok(undefined);
    }
  }
}
