import { describe, it, expect, vi } from "vitest";
import { NotificationRetryScheduler } from "@/domain/application/use-cases/notification-retry-scheduler";
import { makeNotification } from "@/factories/make-notification";
import { makeNotificationMocks } from "@/mocks/mock-notification-dependencies";

describe("NotificationRetryScheduler", () => {
  it("hould save the notification if you exceed the maximum number of attempts", async () => {
    const { publisher: gateway, repository, logger } = makeNotificationMocks();
    const scheduler = new NotificationRetryScheduler(gateway, repository, logger);
    const notification = makeNotification({ tries: 5 }); 

    vi.spyOn(notification, "exceededMaxTries").mockReturnValue(true);
    await scheduler.execute(notification);

    expect(logger.error).toHaveBeenCalledWith("max retries exceeded", { id: notification.id });
    expect(repository.save).toHaveBeenCalledWith(notification);
  });

  it("dhould save if the retry fails to publish", async () => {
    const { publisher: gateway, repository, logger } = makeNotificationMocks();
    const scheduler = new NotificationRetryScheduler(gateway, repository, logger);

    const notification = makeNotification();
    vi.spyOn(notification, "exceededMaxTries").mockReturnValue(false);

    gateway.publishToRetry = vi.fn().mockResolvedValue({ isSuccess: false });

    await scheduler.execute(notification);

    expect(logger.error).toHaveBeenCalledWith("failed to schedule retry", { id: notification.id });
    expect(repository.save).toHaveBeenCalledWith(notification);
  });

  it("it should not save if the retry is published successfully", async () => {
    const { publisher: gateway, repository, logger } = makeNotificationMocks();
    const scheduler = new NotificationRetryScheduler(gateway, repository, logger);

    const notification = makeNotification();
    vi.spyOn(notification, "exceededMaxTries").mockReturnValue(false);
    gateway.publishToRetry = vi.fn().mockResolvedValue({ isSuccess: true });

    await scheduler.execute(notification);

    expect(repository.save).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });
});
