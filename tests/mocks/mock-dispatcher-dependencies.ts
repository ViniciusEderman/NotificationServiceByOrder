import { vi } from "vitest";
import { makeLogger } from "@/mocks/make-logger";
import { NotificationSender } from "@/domain/interfaces/notification-sender";
import { NotificationRetryScheduler } from "@/domain/application/use-cases/notification-retry-scheduler";
import { NotificationCreationPublisher } from "@/domain/application/use-cases/notification-creation-publisher";

export function makeDispatcherMocks() {
  const sender: NotificationSender = {
    send: vi.fn(),
  };

  const retry: NotificationRetryScheduler = {
    execute: vi.fn(),
  } as unknown as NotificationRetryScheduler;

  const publisher: NotificationCreationPublisher = {
    execute: vi.fn(),
  } as unknown as NotificationCreationPublisher;

  const logger = makeLogger();

  return { sender, retry, publisher, logger };
}
