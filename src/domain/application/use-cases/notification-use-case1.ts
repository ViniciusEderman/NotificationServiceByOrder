import { DomainNotification } from "@/domain/enterprise/entities/notification";
import { Logger } from "@/domain/interfaces/logger";
import { NotificationSender } from "@/domain/interfaces/notification-sender";
import { NotificationGateway } from "@/domain/interfaces/queue";
import { NotificationRepository } from "@/domain/interfaces/notification-repository";

const MAX_TRIES = 5;

// ANALISAR + RESTRUTURAR: CRIAÇÃO DE NOVOS USE-CASES PARA MANTER O S(SOLID)
export class SendNotificationUseCase {
  constructor(
    private logger: Logger,
    private sender: NotificationSender,
    private gateway: NotificationGateway,
    private repositorie: NotificationRepository
  ) {}

  async execute(notification: DomainNotification) {
    this.logger.info("transmitting a notification...", {
      status: notification.status,
      recipient: notification.recipient,
      channel: notification.channel,
      id: notification.id,
    });

    const sendMessageResult = await this.sender.send(notification);

    if (!sendMessageResult.isSuccess) {
      notification.tries = (notification.tries || 0) + 1;

      if (notification.tries > MAX_TRIES) {
        this.logger.error("", {
          status: notification.status,
          recipient: notification.recipient,
          channel: notification.channel,
          id: notification.id,
        });

        await this.repositorie.save(notification);
        return;
      }

      this.logger.info("");
      const retryResult = await this.gateway.publishToRetry(notification);

      if (!retryResult.isSuccess) {
        this.logger.error("");
      }
      return;
    }

    const publishResult = await this.gateway.publishToCreate(notification);
    if (!publishResult.isSuccess) {
      this.logger.error("", {
        status: notification.status,
        recipient: notification.recipient,
        channel: notification.channel,
        id: notification.id,
      });

      await this.repositorie.save(notification);
      return;
    }
  }
}
