import { NotificationGateway } from "@/domain/interfaces/queue";
import { NotificationRepository } from "@/domain/interfaces/notification-repository";
import { vi } from "vitest";
import { makeLogger } from "@/mocks/make-logger";

export function makeNotificationMocks() {
  const publisher: NotificationGateway = {
    publishToCreate: vi.fn(),
    publishToRetry: vi.fn(),
  };

  const repository: NotificationRepository = {
    save: vi.fn(),
  };

  const logger = makeLogger();

  return { publisher, repository, logger };
}
