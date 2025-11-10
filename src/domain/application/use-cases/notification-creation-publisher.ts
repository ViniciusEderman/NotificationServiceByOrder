import { DomainNotification } from "@/domain/enterprise/entities/notification";
import { Logger } from "@/domain/interfaces/logger";
import { NotificationRepository } from "@/domain/interfaces/notification-repository";
import { NotificationGateway } from "@/domain/interfaces/queue";

export class NotificationCreationPublisher {
  constructor(
    private gateway: NotificationGateway,
    private repository: NotificationRepository,
    private logger: Logger
  ) {}

  async handleSuccess(notification: DomainNotification): Promise<void> {
    const result = await this.gateway.publishToCreate(notification);

    if (!result.isSuccess) {
      this.logger.error("Failed to publish creation", { id: notification.id });
      await this.repository.save(notification);
    }
  }
}
