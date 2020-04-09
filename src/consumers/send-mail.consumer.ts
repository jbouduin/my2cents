import { inject, injectable } from 'inversify';
import * as nodemailer from 'nodemailer';
import 'reflect-metadata';

import { Comment } from '../db/entities';
import { MailProtocol } from '../objects/configuration';
import { CallbackParameter, EventType, IEvent } from '../objects/events';
import { IConfigurationService } from '../services';

import { ConsumerCallback, IConsumer } from './consumer';

import SERVICETYPES from '../services/service.types';

export interface ISendMailConsumer extends IConsumer { }

@injectable()
export class SendMailConsumer implements ISendMailConsumer {

  // constructor
  public constructor(
    @inject(SERVICETYPES.ConfigurationService) private configurationService: IConfigurationService) { }

  // interface members
  public registerConsumers(): Array<[EventType, ConsumerCallback]> {
    const result = new Array<[EventType, ConsumerCallback]>();
    if (this.configurationService.environment.mail.mailProtocol !== MailProtocol.NOMAIL) {
      result.push([EventType.COMMENTPOSTED, this.CommentPostedCallBack]);
    }
    return result;
  }

  // callback method
  private CommentPostedCallBack(callbackParameter: CallbackParameter<Comment>): void {
    try {
      const comment = callbackParameter.data;
      const user = comment.user.display_name || comment.user.name;
      const to = `My2Cents Admin <${this.configurationService.environment.mail.to}>`;
      const from = `${user} <${this.configurationService.environment.mail.from}>`;
      const subject = `New comment on your post ${comment.slug}`;
      const body = this.createEmailBody(comment);

      if (this.configurationService.environment.mail.mailProtocol === MailProtocol.SMTP) {
        this.sendSmtpMail(to, from, subject, body);
      } else if (this.configurationService.environment.mail.mailProtocol === MailProtocol.SENDMAIL) {
        this.sendSendMailMail(to, from, subject, body);
      }
    } catch (error) {
      console.error('Error sending sendmail notification:', error);
    }
  }

  // helper methods
  private sendSendMailMail(to: string, from: string, subject: string, body: string): void {
    const transporter = nodemailer.createTransport(
      {
        newline: 'unix',
        path: this.configurationService.environment.mail.sendMail.path,
        sendmail: true
      }
    );
    transporter.sendMail(
      {
        from,
        subject,
        text: body,
        to
      },
      (err, info) => {
        console.debug(info.envelope);
        console.debug(info.messageId);
      });
    }

  private async sendSmtpMail(to: string, from: string, subject: string, body: string): Promise<any> {
    const transporter = nodemailer.createTransport({
      auth: {
        pass: this.configurationService.environment.mail.smtp.password,
        user: this.configurationService.environment.mail.smtp.user
      },
      host: this.configurationService.environment.mail.smtp.host,
      port: this.configurationService.environment.mail.smtp.port,
      secure: this.configurationService.environment.mail.smtp.secure
    });

    const info = await transporter.sendMail({
        from,
        subject,
        text: body,
        to
        // TODO: html => '<b>Hello world?</b>' // html body
    });

    console.debug(`Message sent: ${info.messageId}`);
    return Promise.resolve(true);

  }

  private createEmailBody(comment: Comment): string {
      const postUrl = this.configurationService.getPageUrl().replace('%SLUG%', comment.slug);
      const user = comment.user.display_name || comment.user.name;

      const result = `
  New comment on your post ${postUrl}

  Author: ${user}

  ${comment.comment}

  You can see all comments on this post here:
  ${postUrl}#comments

  Permalink: ${postUrl}#comment-${comment.id}
  `
          .split(/\n/)
          .join('\r\n')
          .trim();

      return result;
  }

}
