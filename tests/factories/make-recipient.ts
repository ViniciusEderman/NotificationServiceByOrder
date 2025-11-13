import { Recipient } from "@/domain/enterprise/entities/recipient";

export function makeRecipient(
  overrides: Partial<{
    clientId: string;
    phoneNumber: string;
    name: string;
  }> = {}
) {
  const result = Recipient.create({
    clientId: overrides.clientId ?? "521663da-0efe-48d6-b858-d80d380a85f3",
    phoneNumber: overrides.phoneNumber ?? "+5511999999999",
    name: overrides.name ?? "Test",
  });

  if (!result.isSuccess) {
    const error = result.getError();
    throw new Error(
      `Error creating test recipient: ${error.code} - ${error.message}`
    );
  }

  return result.getValue();
}
