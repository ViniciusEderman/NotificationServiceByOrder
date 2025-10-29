import { Recipient } from "@/domain/enterprise/entities/recipient";
import { Result } from "@/shared/core/result";

export interface RecipientRepository {
  findByClientId(clientId: string): Promise<Result<Recipient | null>>;
}
