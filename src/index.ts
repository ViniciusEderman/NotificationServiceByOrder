import "reflect-metadata";
import "@/shared/container/container";
import { container } from "tsyringe";
import { NotificationSenderWorker } from "@/infra/rabbitmq/workers/notification-sender-worker";
import { NotificationPersistenceWorker } from "@/infra/rabbitmq/workers/notification-persistence-worker";

async function bootstrap() {
  try {
    const senderWorker = container.resolve<NotificationSenderWorker>(NotificationSenderWorker);
    const persistenceWorker = container.resolve<NotificationPersistenceWorker>(
      NotificationPersistenceWorker
    );

    await Promise.all([
      senderWorker.startListening(),
      persistenceWorker.startListening(),
    ]);

  } catch (error) {
    process.exit(1);
  }
}

bootstrap();
