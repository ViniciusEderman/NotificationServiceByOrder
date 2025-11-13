import { DomainNotification } from "@/domain/enterprise/entities/notification";
import { Result } from "@/shared/core/result";

export interface NotificationRepository {
  save(notification: DomainNotification): Promise<Result<void>>;
}
