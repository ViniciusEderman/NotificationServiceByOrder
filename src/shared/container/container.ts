import { container } from "tsyringe";
import { WinstonLogger } from "@/infra/logging/winston-logger";
import { Rabbit } from "@/infra/rabbitmq/rabbitmq-notification-gateway";
import { NotificationGateway } from "@/domain/interfaces/queue";
import { NotificationDispatcher } from "@/domain/application/use-cases/notification-dispatcher-use-case";
import { SendNotificationUseCase } from "@/domain/application/use-cases/notification-use-case";
import { NotificationSenderWorker } from "@/infra/rabbitmq/workers/notification-sender-worker";
import { NotificationPersistenceWorker } from "@/infra/rabbitmq/workers/notification-persistence-worker";

container.registerSingleton(WinstonLogger);

container.registerSingleton<NotificationGateway>("NotificationGateway", Rabbit);

container.registerSingleton(NotificationDispatcher);

container.registerSingleton(SendNotificationUseCase);

container.registerSingleton(NotificationSenderWorker);

container.registerSingleton(NotificationPersistenceWorker);
