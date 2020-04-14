import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import * as request from 'request';

import { Comment } from '../db/entities';
import { CallbackParameter, EventType, IEvent } from '../objects/events';
import { IConfigurationService } from '../services';

import { ConsumerCallback, IConsumer } from './consumer';

import SERVICETYPES from '../services/service.types';

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
    const url = this.configurationService.environment.notification.slack.webHookUrl;
    // FIXME: (#590) Duplicate code - this is the same method that can be found in the validation of the configuration
    const regexp =  /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
    if (url && url.match(regexp) !== null) {
      result.push([EventType.COMMENTPOSTED, this.CommentPostedCallBack]);
    }
    return result;
  }

  // callback method
  private CommentPostedCallBack(callbackParameter: CallbackParameter<Comment>): void {
    try {
      const comment = callbackParameter.data;
      const postUrl = callbackParameter.configurationService.getPageUrl().replace('%SLUG%', comment.slug);
      const user = comment.user.displayName || comment.user.name;
      const slackComment = comment.comment
        .split(/\n+/)
        .map(s => (s ? `> _${s}_` : '>'))
        .join('\n>\n');
      const text = `A <${postUrl}|new comment> was posted by ${user} under *${comment.slug}*:\n\n${slackComment}`;
      request({
        body: { 'text': text },
        json: true,
        method: 'post',
        url: callbackParameter.configurationService.environment.notification.slack.webHookUrl
      });
      console.debug('event send to slack');
    } catch (error) {
      console.error('Error sending slack notification:', error);
    }
  }
}
