import { DomainNotification } from "@/domain/enterprise/entities/notification";
import { Logger } from "@/domain/interfaces/logger";
import { NotificationRepository } from "@/domain/interfaces/notification-repository";
import { NotificationGateway } from "@/domain/interfaces/queue";
import { Result } from "@/shared/core/result";

export class NotificationRetryScheduler {
  constructor(
    private gateway: NotificationGateway,
    private repository: NotificationRepository,
    private logger: Logger
  ) {}

  async execute(notification: DomainNotification): Promise<Result<void>> {
    notification.incrementTries();

    if (notification.exceededMaxTries()) {
      this.logger.error("max retries exceeded", { id: notification.id });
      await this.repository.save(notification);
      return Result.ok(undefined);
    }

    const result = await this.gateway.publishToRetry(notification);
    if (!result.isSuccess) {
      this.logger.error("failed to schedule retry", { id: notification.id });
      await this.repository.save(notification);

      return Result.fail(result.getError());
    }
    return Result.ok(undefined);
  }
}
