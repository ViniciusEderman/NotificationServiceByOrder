import { describe, it, expect, vi } from "vitest";
import { SendNotificationUseCase } from "@/domain/application/use-cases/notification-use-case";
import { NotificationDispatcher } from "@/domain/application/use-cases/notification-dispatcher-use-case";
import { DomainNotification } from "@/domain/enterprise/entities/notification";
import { makeRecipient } from "@/factories/make-recipient";
import { makeNotificationEvent } from "@/factories/make-notification-event";
import { makeNotification } from "@/factories/make-notification";
import { makeLogger } from "@/mocks/make-logger";
import { Result, AppError } from "@/shared/core/result";
import { Recipient } from "@/domain/enterprise/entities/recipient";

describe("SendNotificationUseCase", () => {
  it("should return an error if it cannot find the recipient (findByClientId fails)", async () => {
    const logger = makeLogger();

    const recipientRepository = {
      findByClientId: vi
        .fn()
        .mockResolvedValue(Result.fail(new AppError("ANY", "fail"))),
    };

    const dispatcher = {
      execute: vi.fn(),
    } as unknown as NotificationDispatcher;

    const useCase = new SendNotificationUseCase(
      logger,
      recipientRepository,
      dispatcher
    );

    const event = makeNotificationEvent({
      clientId: "901e0a9d-ff88-4b7c-b23f-53cf362c24d0",
    });
    
    const result = await useCase.execute(event);

    expect(logger.error).toHaveBeenCalledWith(
      "failed to find recipient",
      expect.any(AppError)
    );
    expect(result.isSuccess).toBe(false);
  });

  it("should return an error if the recipient does not exist", async () => {
    const logger = makeLogger();

    const recipientRepository = {
      findByClientId: vi.fn().mockResolvedValue(Result.ok(null)),
    };

    const dispatcher = {
      execute: vi.fn(),
    } as unknown as NotificationDispatcher;

    const useCase = new SendNotificationUseCase(
      logger,
      recipientRepository,
      dispatcher
    );

    const event = makeNotificationEvent({ clientId: "999" });
    const result = await useCase.execute(event);

    expect(logger.error).toHaveBeenCalledWith("recipient not found", {
      clientId: event.clientId,
    });
    expect(result.isSuccess).toBe(false);
  });

  it("should return an error if it fails to create the notification", async () => {
    const logger = makeLogger();
    const recipient = makeRecipient();

    const recipientRepository = {
      findByClientId: vi.fn().mockResolvedValue(Result.ok(recipient)),
    };

    vi.spyOn(DomainNotification, "create").mockReturnValue(
      Result.fail(new AppError("CREATE_ERROR", "invalid"))
    );

    const dispatcher = {
      execute: vi.fn(),
    } as unknown as NotificationDispatcher;

    const useCase = new SendNotificationUseCase(
      logger,
      recipientRepository,
      dispatcher
    );

    const event = makeNotificationEvent({ clientId: "123" });
    const result = await useCase.execute(event);

    expect(logger.error).toHaveBeenCalledWith(
      "failed to create notification",
      expect.any(AppError)
    );
    expect(result.isSuccess).toBe(false);
  });

  it("must successfully create and dispatch the notification", async () => {
    const logger = makeLogger();
    const recipient = makeRecipient() as Recipient;
    const fakeNotification = { id: "uuid-123" } as any;

    vi.spyOn(DomainNotification, "create").mockReturnValue(
      Result.ok(fakeNotification)
    );

    const recipientRepository = {
      findByClientId: vi.fn().mockResolvedValue(Result.ok(recipient)),
    };

    const dispatcher = {
      execute: vi.fn().mockResolvedValue(undefined),
    } as unknown as NotificationDispatcher;

    const useCase = new SendNotificationUseCase(
      logger,
      recipientRepository,
      dispatcher
    );

    const event = makeNotificationEvent({ clientId: recipient.clientId });
    const result = await useCase.execute(event);

    expect(result.isSuccess).toBe(true);
    expect(dispatcher.execute).toHaveBeenCalledWith(fakeNotification);
    expect(result.getValue()).toBe(fakeNotification);
  });
});
