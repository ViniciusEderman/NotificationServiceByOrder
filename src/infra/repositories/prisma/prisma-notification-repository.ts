import { injectable } from "tsyringe";
import { DomainNotification } from "@/domain/enterprise/entities/notification";
import { Logger } from "@/domain/interfaces/logger";
import { NotificationRepository } from "@/domain/interfaces/notification-repository";
import { AppError, Result } from "@/shared/core/result";
import { prisma } from "@/infra/repositories/prisma/prisma";
import { NotificationPresenter } from "@/infra/presenters/notification-presenter";

@injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly logger: Logger) {}

  async save(notification: DomainNotification): Promise<Result<void>> {
    const notificationData = NotificationPresenter.toPersistence(notification);

    this.logger.info("saving notification", {
      notificationId: notificationData.id,
      externalId: notificationData.externalId,
    });

    try {
      await prisma.notification.create({
        data: {
          ...notificationData,
          recipient: {
            connect: { clientId: notificationData.recipientId },
          },
        },
      });

      this.logger.info("notification saved successfully", {
        notificationId: notificationData.id,
        externalId: notificationData.externalId,
      });

      return Result.ok<void>(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error("failed to save notification", {
        notificationId: notificationData.id,
        externalId: notificationData.externalId,
        error: message,
        stack: error instanceof Error ? error.stack : undefined,
      });

      return Result.fail(
        new AppError("NOTIFICATION_SAVE_ERROR", "failed to save notification", {
          notificationId: notificationData.id,
          externalId: notificationData.externalId,
          cause: message,
        })
      );
    }
  }
}
