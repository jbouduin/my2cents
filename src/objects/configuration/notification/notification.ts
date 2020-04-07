import { CfgPushover } from './pushover';
import { CfgSlack } from './slack';
import { CfgWebpush } from './webpush';

export class CfgNotification {
  public interval: number;
  public pushover: CfgPushover;
  public slack: CfgSlack;
  public webpush: CfgWebpush;

  public constructor() {
    this.interval = 60000;
  }
}
