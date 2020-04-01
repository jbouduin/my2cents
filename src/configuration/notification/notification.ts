import { Pushover } from './pushover';
import { Slack } from './slack';
import { Webpush } from './webpush';

export class Notification {
  public interval: number;
  public pushover: Pushover;
  public slack: Slack;
  public webpush: Webpush;

  public constructor() {
    this.interval = 60000;
  }
}
