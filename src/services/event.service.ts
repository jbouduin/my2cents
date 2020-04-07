import { EventEmitter } from 'events';
import * as express from 'express';

import { inject, injectable } from 'inversify';

import { EventType, IEvent } from '../events';
import { CallbackParameter } from '../events/consumers';
import { IPushConsumer, ISendMailConsumer, ISlackConsumer, IWriteLogConsumer } from '../events/consumers';

import { IConfigurationService} from './configuration.service';
import { IService } from './service';

import CONSUMERTYPES from '../events/consumers/consumer.types';
import SERVICETYPES from './service.types';

export interface IEventService extends IService {
  postEvent(event: IEvent): void;
 }

@injectable()
export class EventService implements IEventService {

  // private properties
  private emitter: EventEmitter;

  // constructor
  public constructor(
    @inject(SERVICETYPES.ConfigurationService) private configurationService: IConfigurationService,
    @inject(CONSUMERTYPES.PushConsumer) private pushConsumer: IPushConsumer,
    @inject(CONSUMERTYPES.SendMailConsumer) private sendMailConsumer: ISendMailConsumer,
    @inject(CONSUMERTYPES.SlackConsumer) private slackConsumer: ISlackConsumer,
    @inject(CONSUMERTYPES.WriteLogConsumer) private writeLogConsumer: IWriteLogConsumer) { }

  // interface members
  public async initialize(app: express.Application): Promise<any> {
    console.debug('Initializing EventService');
    this.emitter = new EventEmitter();
    this.pushConsumer.registerConsumers().forEach(consumer => this.emitter.on(consumer[0], consumer[1]));
    this.sendMailConsumer.registerConsumers().forEach(consumer => this.emitter.on(consumer[0], consumer[1]));
    this.slackConsumer.registerConsumers().forEach(consumer => this.emitter.on(consumer[0], consumer[1]));
    this.writeLogConsumer.registerConsumers().forEach(consumer => this.emitter.on(consumer[0], consumer[1]));
    return Promise.resolve(true);
  }

  public postEvent(event: IEvent): void {
    const eventType = event.getEventType();
    const eventData = event.getData();
    let newParameter;

    switch (eventType) {
      case EventType.COMMENTAPPROVED:
      case EventType.COMMENTPOSTED:
      case EventType.COMMENTREJECTED: {
        newParameter = new CallbackParameter<Comment>(
          this.pushConsumer,
          this.sendMailConsumer,
          this.slackConsumer,
          this.writeLogConsumer,
          eventData as Comment
        );
        break;
      }
      default: {
        newParameter = new CallbackParameter<any>(
          this.pushConsumer,
          this.sendMailConsumer,
          this.slackConsumer,
          this.writeLogConsumer,
          eventData
        );
        break;
      }
    }

    this.emitter.emit(eventType, newParameter);
  }
}
