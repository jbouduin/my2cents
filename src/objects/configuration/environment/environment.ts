import { CfgAuthentication } from '../authentication/authentication';
import { CfgDatabase } from '../database/database';
import { CfgMail } from '../mail/mail';

import { CfgNotification } from '../notification/notification';
import { CfgServer } from './server';

export class CfgEnvironment {

  // public properties
  public authentication: CfgAuthentication;
  public database: CfgDatabase;
  public mail: CfgMail;
  public notification: CfgNotification;
  public server: CfgServer;

  // constructor
  public constructor() {
    this.authentication = new CfgAuthentication();
    this.database = new CfgDatabase();
    this.mail = new CfgMail();
    this.notification = new CfgNotification();
    this.server = new CfgServer();
  }

}
