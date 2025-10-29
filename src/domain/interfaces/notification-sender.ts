import { Notification } from "@/domain/enterprise/entities/notification";
import { Result } from "@/shared/core/result";

export interface NotificationSender {
  send(notification: Notification): Promise<Result<void>>;
}
