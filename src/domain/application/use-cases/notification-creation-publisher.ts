import { NotificationRepository } from "@/domain/interfaces/notification-repository";
import { DomainNotification } from "@/domain/enterprise/entities/notification";
import { Logger } from "@/domain/interfaces/logger";
import { NotificationGateway } from "@/domain/interfaces/queue";
import { inject, injectable } from "tsyringe";

@injectable()
export class NotificationCreationPublisher {
  constructor(
    private logger: Logger,
    private publisher: NotificationGateway,
    private repository: NotificationRepository
  ) {}

  async execute(notification: DomainNotification): Promise<void> {
    this.logger.info("publishing...", { notification });
    const result = await this.publisher.publishToCreate(notification);

    if (!result.isSuccess) {
      this.logger.error("failed to publish creation", { id: notification.id });
      await this.repository.save(notification);
    }
  }
}
