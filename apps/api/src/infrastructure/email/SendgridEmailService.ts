import sgMail from '@sendgrid/mail';
import { injectable } from 'tsyringe';
import type {
  EmailMessage,
  IEmailService,
} from '../../application/ports/services/IEmailService.js';

@injectable()
export class SendgridEmailService implements IEmailService {
  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    sgMail.setApiKey(apiKey);
  }

  public async send(message: EmailMessage): Promise<void> {
    await sgMail.send({
      to: message.to,
      from: this.from,
      subject: message.subject,
      html: message.htmlBody,
      ...(message.textBody !== undefined ? { text: message.textBody } : {}),
    });
  }
}

@injectable()
export class NoopEmailService implements IEmailService {
  public async send(_: EmailMessage): Promise<void> {
    // No-op in dev/test when SENDGRID_API_KEY is not configured.
  }
}
