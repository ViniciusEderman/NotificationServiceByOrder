import { Channel, Status } from "@/domain/enterprise/entities/notification";
import { Recipient } from "@/domain/enterprise/entities/recipient";

export interface NotificationEvent {
  clientId: string;
  channel: Channel;
  status: Status;
  tries: number; 
  recipient: Recipient;
}
