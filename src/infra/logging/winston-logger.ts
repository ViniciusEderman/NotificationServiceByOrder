import { Logger } from "@/domain/interfaces/logger";
import winston from "winston";
import { injectable } from "tsyringe";

@injectable()
export class WinstonLogger implements Logger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "app.log" }),
      ],
    });
  }
  info(message: string, meta?: Record<string, any>) {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: Record<string, any>) {
    this.logger.warn(message, meta);
  }

  error(message: string, meta?: Record<string, any>) {
    this.logger.error(message, meta);
  }

  debug(message: string, meta?: Record<string, any>) {
    this.logger.debug(message, meta);
  }
}
