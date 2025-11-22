export enum NotificationType {
  NEW_ORDER = 'NEW_ORDER',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  ORDER_UPDATED = 'ORDER_UPDATED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  DOCUMENT_APPROVED = 'DOCUMENT_APPROVED',
  DOCUMENT_REJECTED = 'DOCUMENT_REJECTED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  SYSTEM_MESSAGE = 'SYSTEM_MESSAGE'
}
export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

