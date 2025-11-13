import {
  DomainNotification,
  Status,
} from "@/domain/enterprise/entities/notification";
import { Logger } from "@/domain/interfaces/logger";
import { NotificationEvent } from "@/domain/application/dtos/notification-event.dto";
import { RecipientRepository } from "@/domain/interfaces/recipient-repository";
import { NotificationDispatcher } from "@/domain/application/use-cases/notification-dispatcher-use-case";
import { AppError, Result } from "@/shared/core/result";
import { injectable } from "tsyringe";

@injectable()
export class SendNotificationUseCase {
  constructor(
    private logger: Logger,
    private recipientRepository: RecipientRepository,
    private dispatcher: NotificationDispatcher,
  ) {}

  async execute(event: NotificationEvent): Promise<Result<DomainNotification>> {
    const recipientResult = await this.recipientRepository.findByClientId(
      event.clientId
    );

    if (!recipientResult.isSuccess) {
      this.logger.error("failed to find recipient", recipientResult.getError());
      return Result.fail(recipientResult.getError());
    }

    const recipient = recipientResult.getValue();
    if (!recipient) {
      this.logger.error("recipient not found", { clientId: event.clientId });
      return Result.fail(
        new AppError("RECIPIENT_NOT_FOUND", "recipient not found")
      );
    }
    
    const notificationResult = DomainNotification.create({
      status: event.status || Status.Pending,
      channel: event.channel || "SMS",
      recipient,
      tries: event.tries || 0,
    });

    if (!notificationResult.isSuccess) {
      this.logger.error("failed to create notification", notificationResult.getError());
      return notificationResult;
    }

    const notification = notificationResult.getValue();
    await this.dispatcher.execute(notification);
    
    return Result.ok(notification);
  }
}
