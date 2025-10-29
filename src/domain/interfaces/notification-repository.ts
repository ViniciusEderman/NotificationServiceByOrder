import { Notification } from "@/domain/enterprise/entities/notification";
import { Result } from "@/shared/core/result";

export interface NotificationRepository {
  create(notification: Notification): Promise<Result<void>>;
  findById(id: string):Promise<Result<Notification | null>>;
  update(notification: Notification): Promise<Result<void>>;
}
