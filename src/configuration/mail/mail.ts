import { SendMail } from './send-mail';
import { Smtp } from './smtp';

export enum MailProtocol {
  SENDMAIL = 'sendmail',
  SMTP = 'smtp',
  NOMAIL = 'nomail'
}

export class Mail {

  public from: string;
  public mailProtocol: MailProtocol;
  public sendMail: SendMail;
  public smtp: Smtp;
  public to: string;

  public constructor() {
    this.mailProtocol = MailProtocol.NOMAIL;
    this.sendMail = new SendMail();
    this.smtp = new Smtp();
  }
}
