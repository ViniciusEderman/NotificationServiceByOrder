import { Recipient } from "@/domain/enterprise/entities/recipient";
import { AppError, Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/core/unique-entity-id";

export enum Status {
  Pending = "pending",
  Accepted = "accepted",
  Finished = "finished",
  Canceled = "canceled",
}

export type Channel = "SMS";

interface NotificationProps {
  id?: UniqueEntityID;
  status: Status;
  channel: Channel;
  recipient: Recipient;
  createdAt?: Date;
  tries?: number;
}

export class DomainNotification {
  private constructor(
    public readonly id: UniqueEntityID,
    public status: Status,
    public readonly channel: Channel,
    public readonly createdAt: Date,
    public readonly recipient: Recipient,
    public tries: number = 0
  ) {}

  static create(props: NotificationProps): Result<DomainNotification> {
    if (!Object.values(Status).includes(props.status)) {
      return Result.fail(
        new AppError(
          "INVALID_NOTIFICATION_STATUS",
          `the status "${
            props.status
          }" is invalid. Must be one of: ${Object.values(Status).join(", ")}`
        )
      );
    }

    const notification = new DomainNotification(
      props.id ?? new UniqueEntityID(),
      props.status,
      props.channel,
      props.createdAt ?? new Date(),
      props.recipient,
      props.tries ?? 0
    );
    return Result.ok(notification);
  }

  getTries(): number {
    return this.tries;
  }

  incrementTries(): void {
    this.tries++;
  }
}
