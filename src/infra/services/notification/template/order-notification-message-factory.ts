import { DomainNotification } from "@/domain/enterprise/entities/notification";
import { NotificationMessageFactory } from "@/domain/interfaces/notification-message-factory";

export class OrderNotificationMessageFactory implements NotificationMessageFactory {
  createMessage(notification: DomainNotification): string {
    const recipientName = notification.recipient.name;
    const status = this.getStatusText(notification.status);
    
    if (recipientName) {
      return `Olá, ${recipientName}! O status do seu pedido se encontra como: ${status}. Acompanhe pelo número: ${notification.externalId}.`;
    }
    
    return `Olá! O status do seu pedido se encontra como: ${status}. Acompanhe pelo número: ${notification.externalId}.`;
  }

  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'Pendente',
      'accepted': 'Aceito',
      'finished': 'Finalizado',
      'canceled': 'Cancelado',
      'failed': 'Falha no processamento'
    };

    return statusMap[status] || status;
  }
}
