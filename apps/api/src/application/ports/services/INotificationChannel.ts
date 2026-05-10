// Reserved for future SMS support; ship email-only for now.
export interface NotificationPayload {
  recipient: string;
  subject: string;
  body: string;
}

export interface INotificationChannel {
  send(payload: NotificationPayload): Promise<void>;
}

export const INotificationChannelToken = Symbol.for('INotificationChannel');
