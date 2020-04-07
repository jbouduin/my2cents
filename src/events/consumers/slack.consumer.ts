import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import * as request from 'request';

import { Comment } from '../../db/entities';
import { CallbackParameter } from '../../objects/events/callback-parameter';
import { IConfigurationService } from '../../services';

import { EventType, IEvent } from '..';

import { ConsumerCallback, IConsumer } from './consumer';

import SERVICETYPES from '../../services/service.types';

export interface ISlackConsumer extends IConsumer { }

@injectable()
export class SlackConsumer implements ISlackConsumer {

  private webHookUrl = null;

  // constructor
  public constructor(
    @inject(SERVICETYPES.ConfigurationService) private configurationService: IConfigurationService) { }

  // interface members
  public registerConsumers(): Array<[EventType, ConsumerCallback]> {
    const result = new Array<[EventType, ConsumerCallback]>();
    if (this.configurationService.isValidUrl(this.configurationService.environment.notification.slack.webHookUrl)) {
      result.push([EventType.COMMENTPOSTED, this.CommentPostedCallBack]);
    }
    return result;
  }

  // callback method
  private CommentPostedCallBack(callbackParameter: CallbackParameter<Comment>): void {
    try {
      const comment = callbackParameter.data;
      const postUrl = this.configurationService.getPageUrl().replace('%SLUG%', comment.slug);
      const user = comment.user.display_name || comment.user.name;
      const slackComment = comment.comment
        .split(/\n+/)
        .map(s => (s ? `> _${s}_` : '>'))
        .join('\n>\n');
      const text = `A <${postUrl}|new comment> was posted by ${user} under *${comment.slug}*:\n\n${slackComment}`;
      request({
        body: { text },
        json: true,
        method: 'post',
        url: this.configurationService.environment.notification.slack.webHookUrl
      });
    } catch (error) {
      console.error('Error sending slack notification:', error);
    }
  }
}
