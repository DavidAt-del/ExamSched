export interface EmailMessage {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export interface IEmailService {
  send(message: EmailMessage): Promise<void>;
}

export const IEmailServiceToken = Symbol.for('IEmailService');
