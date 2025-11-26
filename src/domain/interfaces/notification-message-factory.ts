import { DomainNotification } from "@/domain/enterprise/entities/notification";

export interface NotificationMessageFactory {
  createMessage(notification: DomainNotification): string;
}
