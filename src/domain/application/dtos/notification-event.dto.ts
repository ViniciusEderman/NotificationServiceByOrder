import { Channel, Status } from "@/domain/enterprise/entities/notification";

export interface NotificationEvent {
  externalId: string;
  clientId: string;
  status: Status;
  channel?: Channel;
  tries?: number;
}
