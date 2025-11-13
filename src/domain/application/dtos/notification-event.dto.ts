import { Channel, Status } from "@/domain/enterprise/entities/notification";

export interface NotificationEvent {
  clientId: string;
  channel?: Channel;
  status?: Status;
  tries?: number;
}
