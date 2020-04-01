import { inject, injectable } from 'inversify';
import * as _ from 'lodash';
import * as pushover from 'pushover-notifications';
import 'reflect-metadata';
import * as request from 'request';
import * as webpush from 'web-push';

import { Comment } from '../../db/entities';
import { ICommentService, IConfigurationService, ISubscriptionService } from '../../services';

import { EventType, IEvent } from '..';

import { ConsumerCallback, IConsumer } from './consumer';

import SERVICETYPES from '../../services/service.types';

export interface IPushConsumer extends IConsumer { }

type Notifier = (msg, callback) => void;

@injectable()
export class PushConsumer implements IPushConsumer {

  // private properties
  private awaitingModeration: Array<Comment>;
  private notifiers: Array<Notifier>;

  // constructor
  public constructor(
    @inject(SERVICETYPES.CommentService) private commentService: ICommentService,
    @inject(SERVICETYPES.ConfigurationService) private configurationService: IConfigurationService,
    @inject(SERVICETYPES.SubscriptionService) private subscriptionService: ISubscriptionService) { }

  // interface members
  public registerConsumers(): Array<[EventType, ConsumerCallback]> {
    const result = new Array<[EventType, ConsumerCallback]>();

    if (this.configurationService.environment.notification.webpush ||
      this.configurationService.environment.notification.pushover) {
      this.initialize();
    }

    if (this.notifiers.length) {

      result.push([EventType.COMMENTAPPROVED, this.CommentApprovedOrRejectedCallBack]);
      result.push([EventType.COMMENTPOSTED, this.CommentPostedCallBack]);
      result.push([EventType.COMMENTREJECTED, this.CommentApprovedOrRejectedCallBack]);
      if (this.configurationService.environment.notification.interval > 0) {
        setInterval(
          this.push,
          this.configurationService.environment.notification.interval,
          this);
      }
    }
    return result;
  }

  // callback methods
  private CommentPostedCallBack(comment: Comment): void {
    try {
      if (!comment.user.trusted) {
        this.awaitingModeration.push(comment);
      }
    } catch (error) {
      console.error('Error queuing comment for push notification:', error);
    }
  }

  private CommentApprovedOrRejectedCallBack(comment: Comment): void {
    try {
      _.remove(this.awaitingModeration, awaiting => awaiting.id === comment.id);
    } catch (error) {
      console.error('Error un-queuing comment for push notification:', error);
    }
  }

  // private methods
  private initialize(): void {
    this.notifiers = new Array<Notifier>();
    // fill awaiting at startup
    this.commentService
      .getCommentsForModeration()
      .then(comments => {
        this.awaitingModeration = comments;
      });
    if (this.configurationService.environment.notification.webpush) {
      this.initializeWebPush();
    }
    if (this.configurationService.environment.notification.pushover) {
      this.initializePushover();
    }
  }

  private initializePushover(): void {
    if (this.configurationService.environment.notification.pushover.appToken &&
      this.configurationService.environment.notification.pushover.userKey) {

      const pusher = new pushover({
          token: this.configurationService.environment.notification.pushover.appToken,
          user: this.configurationService.environment.notification.pushover.userKey
      });
      // TODO: regularly call pushover to make sure that we stay connected
      this.notifiers.push((msg, callback) => {
        try {
          pusher.send(msg, callback);
        } catch (err) {
          console.log('error pushing to pushover:');
          console.log(err);
        }
      });
    }
  }

  private initializeWebPush(): void {
    if (this.configurationService.environment.notification.webpush.publicKey &&
      this.configurationService.environment.notification.webpush.privateKey) {
      try {
        webpush.setVapidDetails(
          this.configurationService.getMy2CentsUrl(),
          this.configurationService.environment.notification.webpush.publicKey,
          this.configurationService.environment.notification.webpush.privateKey
        );
        this.notifiers.push((msg, callback) => {
          this.subscriptionService.getSubscriptions()
            .then(subscriptions => {
              subscriptions.forEach(subscription => {
                console.log(`Webpush to ${subscription.endpoint}`);
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
                );
              });
              // callback;
            });
          });
      } catch (err) {
        console.log('could not initialize webpush: ');
        console.log(err);
      }
    }
  }

  private push(pushConsumer: PushConsumer): void {
    try {
      console.log(new Date() + ' push');
      let bySlug;
      if (pushConsumer.awaitingModeration.length) {
        bySlug = _.countBy(pushConsumer.awaitingModeration, 'slug');
        const slugs = Object.keys(bySlug);
        slugs.forEach(slug => {
          const cnt = bySlug[slug];
          const msg = {
            message: `${cnt} new comment${cnt > 1 ? 's' : ''} on "${slug}" are awaiting moderation.`,
            url: pushConsumer.configurationService.getPageUrl().replace('%SLUG%', slug)
            // sound: !!row.active ? 'pushover' : 'none'
          };
          console.log(msg.message);
          pushConsumer.notifiers.forEach(notifier => {
            try {
              notifier(msg, null);
            } catch (err) {
              console.log(err);
            }
          });
        });
      } else {
        console.log('nothing queued for push');
      }
    } catch (err) {
      console.log('error in push:');
      console.log(err);
    }
  }
}
