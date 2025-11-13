import { container } from "tsyringe";
import { WinstonLogger } from "@/infra/logging/winston-logger";
import { Logger } from "@/domain/interfaces/logger";

container.registerSingleton<Logger>("Logger", WinstonLogger);
