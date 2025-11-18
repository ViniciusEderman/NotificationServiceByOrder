import {
  DomainNotification,
  Status,
  Channel,
} from "@/domain/enterprise/entities/notification";
import { Recipient } from "@/domain/enterprise/entities/recipient";
import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/core/unique-entity-id";

export interface NotificationQueuePayload {
  id: string;
  externalId: string;
  status: Status;
  channel: Channel;
  tries: number;
  recipient: {
    clientId: string;
    phoneNumber: string;
    name?: string;
  };
  createdAt?: string;
}

export class NotificationMapper {
  async execute(raw: NotificationQueuePayload): Promise<DomainNotification> {
    const recipientResult = Recipient.create({
      clientId: raw.recipient.clientId,
      phoneNumber: raw.recipient.phoneNumber,
      name: raw.recipient.name,
    });

    if (!recipientResult.isSuccess) {
      Result.fail(recipientResult.getError());
    }

    const recipient = recipientResult.getValue();
    const createdAt = raw.createdAt ? new Date(raw.createdAt) : new Date();
    const notificationId = new UniqueEntityID(raw.id);

    const notificationResult = DomainNotification.create({
      id: notificationId,
      externalId: raw.externalId,
      status: raw.status,
      channel: raw.channel,
      recipient: recipient as Recipient,
      tries: raw.tries,
      createdAt: createdAt,
    });

    if (!notificationResult.isSuccess) {
      Result.fail(notificationResult.getError());
    }

    return notificationResult.getValue();
  }
}
