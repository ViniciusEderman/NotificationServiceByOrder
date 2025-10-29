import { AppError, Result } from "@/shared/core/result";

export class Recipient {
  private constructor(
    public readonly clientId: string,
    public readonly phoneNumber: string,
    public readonly name?: string
  ) {}

  static create(props: {
    clientId: string;
    phoneNumber: string;
    name?: string;
  }) {
    if (!props.clientId) {
      return Result.fail(
        new AppError("RECIPIENT_CLIENT_ID_REQUIRED", "clientId is required")
      );
    }

    if (!props.phoneNumber) {
      return Result.fail(
        new AppError("RECIPIENT_PHONE_REQUIRED", "phoneNumber is required")
      );
    }

    const recipient = new Recipient(props.clientId, props.phoneNumber, props.name);
    return Result.ok(recipient);
  }
}
