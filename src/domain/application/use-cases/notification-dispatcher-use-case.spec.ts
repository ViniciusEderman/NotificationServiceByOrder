import { describe, it, expect, vi } from "vitest";
import { NotificationDispatcher } from "@/domain/application/use-cases/notification-dispatcher-use-case";
import { makeNotification } from "@/factories/make-notification";
import { makeDispatcherMocks } from "@/mocks/mock-dispatcher-dependencies";
import { Result } from "@/shared/core/result";

describe("NotificationDispatcher", () => {
  it("should send a notification if the delivery is successful", async () => {
    const { sender, retry, publisher, logger } = makeDispatcherMocks();
    const dispatcher = new NotificationDispatcher(sender, retry, publisher, logger);
    const notification = makeNotification();

    vi.mocked(sender.send).mockResolvedValue(Result.ok<void>(undefined));

    const result = await dispatcher.execute(notification);

    expect(sender.send).toHaveBeenCalledWith(notification);
    expect(logger.error).not.toHaveBeenCalled();
    expect(retry.execute).not.toHaveBeenCalled();
    expect(publisher.execute).toHaveBeenCalledWith(notification);
    expect(result.isSuccess).toBe(true);
  });

  it("should trigger a retry if the submission fails", async () => {
    const { sender, retry, publisher, logger } = makeDispatcherMocks();
    const dispatcher = new NotificationDispatcher(sender, retry, publisher, logger);
    const notification = makeNotification();

    const sendError = { code: "SEND_ERROR", message: "failed to send" };
    vi.mocked(sender.send).mockResolvedValue(Result.fail<void>(sendError));

    const result = await dispatcher.execute(notification);

    expect(sender.send).toHaveBeenCalledWith(notification);
    expect(logger.error).toHaveBeenCalledWith("failed to send notification", { id: notification.id });
    expect(retry.execute).toHaveBeenCalledWith(notification);
    expect(publisher.execute).not.toHaveBeenCalled();
    expect(result.isSuccess).toBe(false);
    expect(result.getError()).toBe(sendError);
  });
});
