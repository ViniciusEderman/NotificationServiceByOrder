import { AppError, Result } from "@/shared/core/result";
import {
  Channel,
  Notification,
  Status,
} from "@/domain/enterprise/entities/notification";
import { NotificationRepository } from "@/domain/interfaces/notification-repository";
import { RecipientRepository } from "@/domain/interfaces/recipient-repository";
import { Logger } from "@/domain/interfaces/logger";

export interface CreateNotificationInput {
  clientId: string;
  status: Status;
  channel: Channel;
}

export class CreateNotificationUseCase {
  constructor(
    private readonly notificationRepo: NotificationRepository,
    private readonly recipientRepo: RecipientRepository,
    private logger: Logger
  ) {}

  async execute(input: CreateNotificationInput): Promise<Result<void>> {
    const recipientResult = await this.recipientRepo.findByClientId(
      input.clientId
    );

    if (!recipientResult.isSuccess) {
      this.logger.warn("failed to fetch recipient from repository", {
        clientId: input.clientId,
        error: recipientResult.getError().message,
      });

      return Result.fail(recipientResult.getError());
    }

    const recipient = recipientResult.getValue();

    if (!recipient) {
      this.logger.warn("recipient not found for clientId", {
        clientId: input.clientId,
      });

      return Result.fail(
        new AppError(
          "RECIPIENT_NOT_FOUND",
          `no recipient found for clientId ${input.clientId}`
        )
      );
    }

    const notificationResult = Notification.create({
      recipient,
      channel: input.channel,
      status: input.status,
    });

    if (!notificationResult.isSuccess) {
      this.logger.warn("failed to create notification entity", {
        clientId: input.clientId,
        channel: input.channel,
        status: input.status,
        error: notificationResult.getError().message,
      });

      return Result.fail(notificationResult.getError());
    }

    const notification = notificationResult.getValue();
    const persistResult = await this.notificationRepo.create(notification);

    if (!persistResult.isSuccess) {
      return Result.fail(persistResult.getError());
    }

    return Result.ok(undefined);
  }
}
