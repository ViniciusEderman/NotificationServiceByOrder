import { DomainNotification } from "@/domain/enterprise/entities/notification";

export class NotificationPresenter {
  static toPersistence(notification: DomainNotification) {
    const recipientId = notification.recipient.clientId;

    return {
      id: notification.id.toString(),
      externalId: notification.externalId,
      status: notification.status,
      channel: notification.channel,
      tries: notification.tries,
      recipientId,
      failed: notification.failed ?? false,
      failureMessage: notification.failureMessage ?? null,
      failedAt: notification.failedAt ?? null,
      createdAt: notification.createdAt,
    };
  }
}
