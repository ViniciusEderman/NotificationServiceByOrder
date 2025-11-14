import { NotificationEvent } from "@/domain/application/dtos/notification-event.dto";
import { Status } from "@/domain/enterprise/entities/notification";
import { Recipient } from "@/domain/enterprise/entities/recipient";
import { makeRecipient } from "@/factories/make-recipient";

export function makeNotificationEvent(
  overrides: Partial<NotificationEvent> = {}
): NotificationEvent {
  return {
    clientId: overrides.clientId ?? "11751cc3-e445-4ae1-ad52-9e997352a44a",
    externalId: overrides.externalId ?? "ecc2176b-c2da-43dc-a76c-297326f33b50",
    status: overrides.status ?? Status.Pending,
    channel: overrides.channel ?? "SMS",
    tries: overrides.tries ?? 0,
  };
}
