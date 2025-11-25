import { injectable } from "tsyringe";
import { Recipient } from "@/domain/enterprise/entities/recipient";
import { Logger } from "@/domain/interfaces/logger";
import { RecipientRepository } from "@/domain/interfaces/recipient-repository";
import { AppError, Result } from "@/shared/core/result";
import { prisma } from "@/infra/repositories/prisma/prisma";

@injectable()
export class PrismaRecipientRepository implements RecipientRepository {
  constructor(private readonly logger: Logger) {}

  async findByClientId(clientId: string): Promise<Result<Recipient | null>> {
    try {
      this.logger.info("fetching recipient by clientId", { clientId });

      const recipientRecord: Recipient = await prisma.recipient.findUnique({
        where: { clientId },
      });

      if (!recipientRecord) {
        this.logger.warn("recipient not found in database", { clientId });
        return Result.ok(null);
      }

      return Result.ok(recipientRecord);
    } 
    catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error("prisma recipient lookup failed", {
        clientId,
        error: message,
      });

      return Result.fail<Recipient | null>(
        new AppError("RECIPIENT_LOOKUP_ERROR", "failed to fetch recipient", {
          clientId,
          cause: message,
        })
      );
    }
  }
}
