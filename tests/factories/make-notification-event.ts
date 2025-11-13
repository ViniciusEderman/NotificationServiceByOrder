import { NotificationEvent } from "@/domain/application/dtos/notification-event.dto";
import { Status } from "@/domain/enterprise/entities/notification";
import { Recipient } from "@/domain/enterprise/entities/recipient";
import { makeRecipient } from "@/factories/make-recipient";

export function makeNotificationEvent(
  overrides: Partial<NotificationEvent> = {}
): NotificationEvent {
  const recipient = overrides.recipient ?? (makeRecipient() as Recipient);

  return {
    clientId: overrides.clientId ?? recipient.clientId,
    channel: overrides.channel ?? "SMS",
    status: overrides.status ?? Status.Pending,
    tries: overrides.tries ?? 0,
    recipient,
  };
}
