import "reflect-metadata";
import "@/shared/container/container";
import { container } from "tsyringe";
import { NotificationSenderWorker } from "@/infra/rabbitmq/workers/notification-sender-worker";
import { NotificationPersistenceWorker } from "@/infra/rabbitmq/workers/notification-persistence-worker";
import { Logger } from "@/domain/interfaces/logger";

async function bootstrap() {
  const logger = container.resolve<Logger>("Logger");
  try {
    logger.info("Starting application...");
    const senderWorker = container.resolve<NotificationSenderWorker>(NotificationSenderWorker);
    const persistenceWorker = container.resolve<NotificationPersistenceWorker>(
      NotificationPersistenceWorker
    );

    await Promise.all([
      senderWorker.startListening(),
      persistenceWorker.startListening(),
    ]);

  } catch (error) {
    logger.error("Failed to start application", error as Error);
    process.exit(1);
  }
}

bootstrap();
