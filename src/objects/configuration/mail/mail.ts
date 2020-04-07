import { CfgSendMail } from './send-mail';
import { CfgSmtp } from './smtp';

export enum MailProtocol {
  SENDMAIL = 'sendmail',
  SMTP = 'smtp',
  NOMAIL = 'nomail'
}

export class CfgMail {

  public from: string;
  public mailProtocol: MailProtocol;
  public sendMail: CfgSendMail;
  public smtp: CfgSmtp;
  public to: string;

  public constructor() {
    this.mailProtocol = MailProtocol.NOMAIL;
    this.sendMail = new CfgSendMail();
    this.smtp = new CfgSmtp();
  }
}
