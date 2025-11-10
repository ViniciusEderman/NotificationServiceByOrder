import { DomainNotification } from "@/domain/enterprise/entities/notification";
import { Logger } from "@/domain/interfaces/logger";
import { NotificationSender } from "@/domain/interfaces/notification-sender";
import { NotificationCreationPublisher } from "@/domain/application/use-cases/notification-creation-publisher";
import { NotificationRetryScheduler } from "@/domain/application/use-cases/notification-retry-scheduler";

export class SendNotificationUseCase {
  constructor(
    private logger: Logger,
    private sender: NotificationSender,
    private retryScheduler: NotificationRetryScheduler,
    private creationPublisher: NotificationCreationPublisher,
  ) {}

  async execute(notification: DomainNotification): Promise<void> {
    this.logger.info("transmitting notification...", { id: notification.id });

    const result = await this.sender.send(notification);

    if (!result.isSuccess) {
      await this.retryScheduler.handleFailure(notification);
      return;
    }

    await this.creationPublisher.handleSuccess(notification);
  }
}
