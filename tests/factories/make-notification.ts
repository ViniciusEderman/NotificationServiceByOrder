import {
  DomainNotification,
  Status,
} from "@/domain/enterprise/entities/notification";
import { Recipient } from "@/domain/enterprise/entities/recipient";
import { UniqueEntityID } from "@/shared/core/unique-entity-id";
import { makeRecipient } from "@/factories/make-recipient";

export function makeNotification(
  overrides: Partial<{
    status: Status;
    channel: "SMS";
    recipient: Recipient;
    tries: number;
  }> = {}
) {
  const recipient = (overrides.recipient ?? makeRecipient()) as Recipient;

  const result = DomainNotification.create({
    id: new UniqueEntityID("uuid-123"),
    status: overrides.status ?? Status.Pending,
    channel: overrides.channel ?? "SMS",
    recipient,
    tries: overrides.tries ?? 0,
  });

  if (!result.isSuccess) {
    throw new Error(
      `Error creating test notification: ${result.getError().message}`
    );
  }

  return result.getValue();
}
