import "reflect-metadata";
import { describe, it, expect, vi } from "vitest";
import { NotificationCreationPublisher } from "@/domain/application/use-cases/notification-creation-publisher";
import { makeNotification } from "@/factories/make-notification";
import { makeNotificationMocks } from "@/mocks/mock-notification-dependencies";
import { Result } from "@/shared/core/result";

describe("NotificationCreationPublisher", () => {
  it("must successfully publish a notification", async () => {
    const { publisher, repository, logger } = makeNotificationMocks();
    const useCase = new NotificationCreationPublisher(logger, publisher, repository);
    const notification = makeNotification();
    const markAsFailedSpy = vi.spyOn(notification, "markAsFailed");

    vi.mocked(publisher.publishToCreate).mockResolvedValue(Result.ok<void>(undefined));

    const result = await useCase.execute(notification);

    expect(logger.info).toHaveBeenCalledWith("publishing...", { notification });
    expect(publisher.publishToCreate).toHaveBeenCalledWith(notification);
    expect(logger.error).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
    expect(result.isSuccess).toBe(true);
    expect(markAsFailedSpy).not.toHaveBeenCalled();
  });

  it("should save the notification if the publication fails", async () => {
    const { publisher, repository, logger } = makeNotificationMocks();
    const useCase = new NotificationCreationPublisher(logger, publisher, repository);
    const notification = makeNotification();
    const markAsFailedSpy = vi.spyOn(notification, "markAsFailed");

    vi.mocked(publisher.publishToCreate).mockResolvedValue(
      Result.fail<void>({ code: "PUBLISH_ERROR", message: "failed to publish" })
    );

    const result = await useCase.execute(notification);

    expect(logger.info).toHaveBeenCalledWith("publishing...", { notification });
    expect(logger.error).toHaveBeenCalledWith("failed to publish creation", { id: notification.id });
    expect(repository.save).toHaveBeenCalledWith(notification);
    expect(result.isSuccess).toBe(false);
    expect(markAsFailedSpy).toHaveBeenCalledWith(notification.status, "failed to publish");
  });
});
