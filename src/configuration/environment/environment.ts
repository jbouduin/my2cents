import { Authentication } from '../authentication/authentication';
import { Database } from '../database/database';
import { Mail } from '../mail/mail';

import { Notification } from '../notification/notification';
import { Server } from './server';

export class Environment {

  // public properties
  public authentication: Authentication;
  public database: Database;
  public mail: Mail;
  public notification: Notification;
  public server: Server;

  // constructor
  public constructor() {
    this.authentication = new Authentication();
    this.database = new Database();
    this.mail = new Mail();
    this.notification = new Notification();
    this.server = new Server();
  }

}
