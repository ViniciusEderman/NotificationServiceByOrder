import { Logger } from "@/domain/interfaces/logger";
import { NotificationSender } from "@/domain/interfaces/notification-sender";
import { NotificationCreationPublisher } from "@/domain/application/use-cases/notification-creation-publisher";
import { NotificationRetryScheduler } from "@/domain/application/use-cases/notification-retry-scheduler";
import { DomainNotification } from "@/domain/enterprise/entities/notification";
import { Result } from "@/shared/core/result";

export class NotificationDispatcher {
  constructor(
    private readonly sender: NotificationSender,
    private readonly retry: NotificationRetryScheduler,
    private readonly publisher: NotificationCreationPublisher,
    private readonly logger: Logger
  ) {}

  async execute(notification: DomainNotification): Promise<Result<void>> {
    const sendResult = await this.sender.send(notification);

    if (!sendResult.isSuccess) {
      this.logger.error("failed to send notification", { id: notification.id });
      await this.retry.execute(notification);
      return Result.fail(sendResult.getError());
    }
    
    await this.publisher.execute(notification);
    return Result.ok(undefined);
  }
}
