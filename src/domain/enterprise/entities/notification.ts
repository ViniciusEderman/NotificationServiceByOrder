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
}

export class Notification {
  private constructor(
    public readonly id: UniqueEntityID,
    public status: Status,
    public readonly channel: Channel,
    public readonly createdAt: Date,
    public readonly recipient: Recipient
  ) {}

  static create(props: NotificationProps): Result<Notification> {
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

    const notification = new Notification(
      props.id ?? new UniqueEntityID(),
      props.status,
      props.channel,
      props.createdAt ?? new Date(),
      props.recipient
    );

    return Result.ok(notification);
  }

  markAsFinished() { this.status = "finished"; }
  markAsFailed() { this.status = "failed"; }
  markAsPending() { this.status = "pending"; }
  markAsCanceled() { this.status = "canceled"; }
}
