import { Result } from "@/shared/core/result";
import { NotificationEvent } from "@/domain/application/dtos/notification-event.dto";

export interface QueuePublisher {
  publish(event: NotificationEvent): Promise<void>;
}

interface QueueConsumer {
  consume<T>(queue: string, handler: (message: T) => Promise<Result<void>>): Promise<void>;
}
