import { NotificationSender } from "@/domain/interfaces/notification-sender";
import { NotificationRepository } from "@/domain/interfaces/notification-repository";
import { RecipientRepository } from "@/domain/interfaces/recipient-repository";
import { RetryPolicy } from "@/domain/interfaces/retry-policy";
import { NotificationEvent } from "@/domain/application/dtos/notification-event.dto";
import { Notification } from "@/domain/enterprise/entities/notification";
import { Result, AppError } from "@/shared/core/result";

export class HandleNotificationEventUseCase {
  constructor(
    private readonly recipientRepo: RecipientRepository,
    private readonly notificationSender: NotificationSender,
    private readonly notificationRepo: NotificationRepository,
    private readonly retryPolicy: RetryPolicy,
    private readonly queuePublisher: { publish(event: NotificationEvent): Promise<void> }
  ) {}

  async execute(event: NotificationEvent): Promise<Result<void>> {
    const recipientResult = await this.recipientRepo.findByClientId(event.clientId);
    if (!recipientResult.isSuccess) {
      return Result.fail(
        new AppError("RECIPIENT_NOT_FOUND", `No recipient found for clientId ${event.clientId}`)
      );
    }
    const recipient = recipientResult.getValue();

    if(recipient === null) {
      return;
    }

    const notification = Notification.create({
      recipient,
      channel: event.channel,
      status: event.status
    });

    const sendResult = await this.notificationSender.send(notification);
    if (!sendResult.isSuccess) {
      if (this.retryPolicy.shouldRetry(event.tries)) {
        await this.queuePublisher.publish({ ...event, tries: event.tries + 1 });
        return Result.ok(undefined);
      }

      notification.markAsFailed();
      const persistResult = await this.notificationRepo.create(notification);
      if (!persistResult.isSuccess) return Result.fail(persistResult.getError());
      return Result.fail(sendResult.getError());
    }

    notification.markAsFinished();
    const persistResult = await this.notificationRepo.create(notification);
    if (!persistResult.isSuccess) return Result.fail(persistResult.getError());

    return Result.ok(undefined);
  }
}
