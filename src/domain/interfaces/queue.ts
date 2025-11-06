import { Result } from "@/shared/core/result";
import { DomainNotification } from "@/domain/enterprise/entities/notification";

export interface NotificationWorker {
  startListening(): Promise<void>;
}

export interface NotificationGateway {
  publishToRetry(notification: DomainNotification): Promise<Result<void>>;
  publishToCreate(notification: DomainNotification): Promise<Result<void>>;
}
