import { inject, injectable } from 'inversify';
import 'reflect-metadata';

import { Comment, User } from '../db/entities';
import { CallbackParameter, EventType, IEvent } from '../objects/events';
import { IConfigurationService } from '../services';

import { ConsumerCallback, IConsumer } from './consumer';

import SERVICETYPES from '../services/service.types';

export interface IWriteLogConsumer extends IConsumer { }

// TODO: (#591) get parameters from configuration and implement using a decent logging mechanism
@injectable()
export class WriteLogConsumer implements IWriteLogConsumer {

  // constructor
  public constructor(
    @inject(SERVICETYPES.ConfigurationService) private configurationService: IConfigurationService) { }

  // interface members
  public registerConsumers(): Array<[EventType, ConsumerCallback]> {
    const result = new Array<[EventType, ConsumerCallback]>();
    result.push([EventType.COMMENTPOSTED, this.CommentPostedCallBack]);
    return result;
  }

  // callback method
  private CommentPostedCallBack(callbackParameter: CallbackParameter<Comment>): void {
    const comment = callbackParameter.data;
    console.info(`event: ${EventType.COMMENTPOSTED} on slug '${comment.slug}'' by '${comment.user.display_name || comment.user.name}''`);
  }
}
