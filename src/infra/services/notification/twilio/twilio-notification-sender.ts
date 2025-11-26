import { NotificationMessageFactory } from "@/domain/interfaces/notification-message-factory";
import { DomainNotification } from "@/domain/enterprise/entities/notification";
import { NotificationSender } from "@/domain/interfaces/notification-sender";
import { Logger } from "@/domain/interfaces/logger";
import { AppError, Result } from "@/shared/core/result";

const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export class TwilioNotificationSender implements NotificationSender {
  constructor(
    private readonly logger: Logger,
    private readonly messageFactory: NotificationMessageFactory
  ) {}

  async send(notification: DomainNotification): Promise<Result<void>> {
    try {
      const messageBody = this.messageFactory.createMessage(notification);
      
      const message = await client.messages.create({
        body: messageBody,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: notification.recipient.phoneNumber,
      });

      this.logger.info(`SMS sent successfully to ${notification.recipient.phoneNumber}`, {
        messageSid: message.sid,
        status: message.status
      });

      return Result.ok(undefined);
    } 
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'unknown error';
      this.logger.error('error sending SMS', {
        error: errorMessage,
        notificationId: notification.id.toString(),
        recipient: notification.recipient.phoneNumber
      });
      
      return Result.fail(new AppError('TWILIO_SEND_ERROR', errorMessage));
    }
  }
}