import { container } from "tsyringe";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

import { WinstonLogger } from "@/infra/logging/winston-logger";
import { Rabbit } from "@/infra/rabbitmq/rabbitmq-notification-gateway";
import { NotificationSenderWorker } from "@/infra/rabbitmq/workers/notification-sender-worker";
import { NotificationPersistenceWorker } from "@/infra/rabbitmq/workers/notification-persistence-worker";
import { PrismaNotificationRepository } from "@/infra/repositories/prisma/prisma-notification-repository";
import { PrismaRecipientRepository } from "@/infra/repositories/prisma/prisma-recipient-repository";

import { NotificationGateway } from "@/domain/interfaces/queue";
import { NotificationDispatcher } from "@/domain/application/use-cases/notification-dispatcher-use-case";
import { SendNotificationUseCase } from "@/domain/application/use-cases/notification-use-case";
import { NotificationRepository } from "@/domain/interfaces/notification-repository";
import { RecipientRepository } from "@/domain/interfaces/recipient-repository";
import { NotificationRetryScheduler } from "@/domain/application/use-cases/notification-retry-scheduler";
import { NotificationCreationPublisher } from "@/domain/application/use-cases/notification-creation-publisher";


dotenv.config();

const prisma = new PrismaClient();
container.registerInstance(PrismaClient, prisma);

container.registerSingleton<WinstonLogger>("Logger", WinstonLogger);

container.registerSingleton<NotificationGateway>("NotificationGateway", Rabbit);

container.registerSingleton<NotificationRepository>(
  "NotificationRepository",
  PrismaNotificationRepository
);

container.registerSingleton<RecipientRepository>(
  "RecipientRepository",
  PrismaRecipientRepository
);

container.registerSingleton(NotificationDispatcher);
container.registerSingleton(SendNotificationUseCase);
container.registerSingleton(NotificationRetryScheduler);
container.registerSingleton(NotificationCreationPublisher);

container.registerSingleton(NotificationSenderWorker);
container.registerSingleton(NotificationPersistenceWorker);

container.register("RABBITMQ_URL", { useValue: process.env.RABBITMQ_URL || "amqp://localhost" });
container.register("DATABASE_URL", { useValue: process.env.DATABASE_URL });
container.register("PORT", { useValue: process.env.PORT || 3000 });

export { container };
