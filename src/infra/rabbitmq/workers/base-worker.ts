import { Logger } from "@/domain/interfaces/logger";
import { AppError, Result } from "@/shared/core/result";
import amqp, { Connection, Channel } from "amqplib";

export abstract class WorkerBase {
  protected connection!: Connection;
  protected channel!: Channel;

  constructor(
    protected readonly logger: Logger,
    private readonly amqpUrl: string,
    private readonly queueName: string,
    private readonly workerName: string,
    private readonly prefetch: number = 1,
  ) {}

  async startListening(): Promise<Result<void>> {
    try {
      this.connection = (await amqp.connect( this.amqpUrl )) as unknown as Connection;
      this.logger.info(`${this.workerName} connected to RabbitMQ`);

      this.channel = await (this.connection as any).createChannel();

      if (this.prefetch > 0) {
        await this.channel.prefetch(this.prefetch);
      }

      this.logger.info(`${this.workerName} listening on: ${this.queueName}`);

      await this.channel.consume(this.queueName, (msg) =>
        this.handleMessage(msg)
      );

      this.connectionEvents();

      return Result.ok(undefined);
    } 
    catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`failed to start ${this.workerName}`, {
        error: message,
      });

      return Result.fail(new AppError("WORKER_INITIALIZATION_ERROR", message));
    }
  }

  private connectionEvents() {
    this.connection.on("error", (err: Error) => {
      this.logger.error(`${this.workerName} connection error`, {
        error: err.message,
      });
    });

    this.connection.on("close", () => {
      this.logger.warn(`${this.workerName} connection closed`);
    });
  }

  protected abstract handleMessage(msg: amqp.Message | null): Promise<Result<void>>;
}
