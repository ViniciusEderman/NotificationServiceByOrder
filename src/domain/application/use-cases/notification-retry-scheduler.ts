import { DomainNotification } from "@/domain/enterprise/entities/notification";
import { Logger } from "@/domain/interfaces/logger";
import { NotificationRepository } from "@/domain/interfaces/notification-repository";
import { NotificationGateway } from "@/domain/interfaces/queue";

export class NotificationRetryScheduler {
  constructor(
    private gateway: NotificationGateway,
    private repository: NotificationRepository,
    private logger: Logger
  ) {}

  async execute(notification: DomainNotification): Promise<void> {
    notification.incrementTries();

    if (notification.exceededMaxTries()) {
      this.logger.error("max retries exceeded", { id: notification.id });
      await this.repository.save(notification);
      return;
    }

    const result = await this.gateway.publishToRetry(notification);
    if (!result.isSuccess) {
      this.logger.error("failed to schedule retry", { id: notification.id });
      await this.repository.save(notification);
      return;
    }
  }
}
