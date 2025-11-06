import { DomainNotification } from "@/domain/enterprise/entities/notification";
import { Result } from "@/shared/core/result";

export interface NotificationSender {
  send(notification: DomainNotification): Promise<Result<void>>;
}
