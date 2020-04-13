import { inject, injectable } from 'inversify';
import * as _ from 'lodash';
import * as pushover from 'pushover-notifications';
import 'reflect-metadata';
import * as request from 'request';
import * as webpush from 'web-push';

import { Comment } from '../db/entities';
import { CallbackParameter, EventType, IEvent } from '../objects/events';
import {
  ICommentService,
  IConfigurationService,
  ISettingService,
  ISubscriptionService } from '../services';

import { ConsumerCallback, IConsumer } from './consumer';

import SETTINGKEYS from '../objects/settings/setting.keys';
import SERVICETYPES from '../services/service.types';

export interface IPushConsumer extends IConsumer {
  // TODO (#577) these two methods have to be made threadsafe
  addToAwaitingModeration(comment: Comment): void;
  removeFromAwaitingModeration(comment: Comment): void;
}

type Notifier = (msg, callback) => void;

@injectable()
export class PushConsumer implements IPushConsumer {

  // private properties
  private notifiers: Array<Notifier>;

  // public properties
  public awaitingModeration: Array<Comment>;

  // constructor
  public constructor(
    @inject(SERVICETYPES.CommentService) private commentService: ICommentService,
    @inject(SERVICETYPES.ConfigurationService) private configurationService: IConfigurationService,
    @inject(SERVICETYPES.SettingService) private settingService: ISettingService,
    @inject(SERVICETYPES.SubscriptionService) private subscriptionService: ISubscriptionService) { }

  // interface members
  public addToAwaitingModeration(comment: Comment): void {
    this.awaitingModeration.push(comment)
    console.debug(`awaitingModeration queue contains ${this.awaitingModeration.length} entries`);
  }

  public registerConsumers(): Array<[EventType, ConsumerCallback]> {
    const result = new Array<[EventType, ConsumerCallback]>();

    if (this.configurationService.environment.notification.webpush ||
      this.configurationService.environment.notification.pushover) {
      this.initialize().then( initResult => {
        if (this.notifiers.length) {
          result.push([EventType.COMMENTAPPROVED, this.commentApprovedOrRejectedCallBack]);
          result.push([EventType.COMMENTPOSTED, this.commentPostedCallBack]);
          result.push([EventType.COMMENTREJECTED, this.commentApprovedOrRejectedCallBack]);
          if (this.configurationService.environment.notification.interval > 0) {
            if (this.awaitingModeration.length > 0) {
              this.push(this);
            }
            setInterval(
              this.push,
              this.configurationService.environment.notification.interval,
              this);
          }
        }
      });
   }
    return result;
  }

  public removeFromAwaitingModeration(comment: Comment): void {
    _.remove(this.awaitingModeration, awaiting => awaiting.id === comment.id);
    console.debug(`awaitingModeration queue contains ${this.awaitingModeration.length} entries`);
  }

  // callback methods
  private commentPostedCallBack(callbackParameter: CallbackParameter<Comment>): void {
    try {
      if (!callbackParameter.data.user.trusted) {
        callbackParameter.pushConsumer.addToAwaitingModeration(callbackParameter.data);
      }
    } catch (error) {
      console.error('Error queuing comment for push notification:', error);
    }
  }

  private commentApprovedOrRejectedCallBack(callbackParameter: CallbackParameter<Comment>): void {
    try {
      callbackParameter.pushConsumer.removeFromAwaitingModeration(callbackParameter.data);
    } catch (error) {
      console.error('Error un-queuing comment for push notification:', error);
    }
  }

  // private methods
  private async initialize(): Promise<number> {
    let result = 0;
    this.notifiers = new Array<Notifier>();
    // fill awaiting at startup
    this.awaitingModeration = await this.commentService.getCommentsForModeration();
    console.debug(`awaitingModeration queue contains ${this.awaitingModeration.length} entries`)

    if (this.configurationService.environment.notification.webpush) {
      this.initializeWebPush();
      result++;
    }
    if (this.configurationService.environment.notification.pushover) {
      this.initializePushover();
      result++;
    }

    return Promise.resolve(result);
  }

  private initializePushover(): void {
    if (this.configurationService.environment.notification.pushover.appToken &&
      this.configurationService.environment.notification.pushover.userKey) {
      console.debug('Initializing Pushover');
      const pusher = new pushover({
          token: this.configurationService.environment.notification.pushover.appToken,
          user: this.configurationService.environment.notification.pushover.userKey
      });
      // TODO: (#595) regularly call pushover to make sure that we stay connected
      // the remark comes from the original code. Pushover has to be reviewed and tested anyway
      this.notifiers.push((msg, callback) => {
        try {
          pusher.send(msg, callback);
        } catch (err) {
          console.error('error pushing to pushover:');
          console.error(err);
        }
      });
    }
  }

  private initializeWebPush(): void {
    if (this.configurationService.environment.notification.webpush.publicKey &&
      this.configurationService.environment.notification.webpush.privateKey) {
      try {
        console.debug('Initializing WebPush');
        webpush.setVapidDetails(
          this.configurationService.getMy2CentsUrl(),
          this.configurationService.environment.notification.webpush.publicKey,
          this.configurationService.environment.notification.webpush.privateKey
        );
        this.notifiers.push((msg, callback) => {
          this.subscriptionService.getSubscriptions()
            .then(subscriptions => {
              subscriptions.forEach(subscription => {
                console.debug(`Webpush to ${subscription.endpoint}`);
                webpush.sendNotification(
                  {
                    endpoint: subscription.endpoint,
                    keys: {
                      auth: subscription.auth,
                      p256dh: subscription.publicKey
                    }
                  },
                  JSON.stringify({
                    clickTarget: msg.url,
                    message: msg.message,
                    title: 'my2cents'
                  })
                )
                .catch(err => {
                  // see http://autopush.readthedocs.io/en/latest/http.html#error-codes
                  switch (err.statusCode) {
                    case 404:
                    case 410: {
                      console.info(`Removing subscription with endpoint ${err.enpoint}`);
                      this.subscriptionService.unsubscribe(err.endpoint);
                      break;
                    }
                    default: {
                      console.error(err);
                    }
                  }
                });
              });
            });
          });
      } catch (err) {
        console.error('could not initialize webpush: ');
        console.error(err);
      }
    }
  }

  private push(pushConsumer: PushConsumer): void {
    try {
      if (pushConsumer.awaitingModeration.length)
      {
        pushConsumer.settingService
          .getSetting(SETTINGKEYS.Notification)
          .then(setting => {
            if (JSON.parse(setting.setting).active) {
              console.debug(new Date() + ' push');
              const bySlug = _.countBy(pushConsumer.awaitingModeration, 'slug');
              const slugs = Object.keys(bySlug);
              slugs.forEach(slug => {
                const cnt = bySlug[slug];
                const msg = {
                  message: `${cnt} new comment${cnt > 1 ? 's' : ''} on "${slug}" are awaiting moderation.`,
                  url: pushConsumer.configurationService.getPageUrl().replace('%SLUG%', slug)
                };
                console.debug(msg.message);
                pushConsumer.notifiers.forEach(notifier => {
                  try {
                    notifier(msg, null);
                  } catch (err) {
                    console.error(err);
                  }
                });
              });
            } else {
              console.debug('Notification de-activated');
            }
          });
      } else {
        console.debug('nothing queued for push');
      }
    } catch (err) {
      console.error('error in push:');
      console.error(err);
    }
  }
}
