import {
  DomainNotification,
} from "@/domain/enterprise/entities/notification";
import { Logger } from "@/domain/interfaces/logger";
import { NotificationEvent } from "@/domain/application/dtos/notification-event.dto";
import { RecipientRepository } from "@/domain/interfaces/recipient-repository";
import { AppError, Result } from "@/shared/core/result";
import { injectable } from "tsyringe";

@injectable()
export class SendNotificationUseCase {
  constructor(
    private logger: Logger,
    private recipientRepository: RecipientRepository,
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
      recipient,
      tries: event.tries || 0,
      channel: event.channel || "SMS",
      status: event.status,
      externalId: event.externalId,
    });

    if (!notificationResult.isSuccess) {
      this.logger.error("failed to create notification", notificationResult.getError());
      return notificationResult;
    }

    const notification = notificationResult.getValue();
    return Result.ok(notification);
  }
}
