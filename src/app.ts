import * as bodyParser from 'body-parser';
import { TypeormStore } from 'connect-typeorm';
import * as cors from 'cors';
import * as express from 'express';
import * as expressSession from 'express-session';

import { Session } from './db/entities';

import container from './inversify.config';
import {
  IAuthenticationService,
  IConfigurationService,
  ICommentService,
  IDatabaseService,
  IEventService,
  IRouteService,
  ISettingService,
  IUserService } from './services';
import SERVICETYPES from './services/service.types';

class App {

  // public properties
  public app: express.Application;

  // private properties
  private configurationService: IConfigurationService;
  private databaseService: IDatabaseService;

  // public methods
  public async initialize(): Promise<App> {
    this.app = express();
    this.configurationService = container.get<IConfigurationService>(SERVICETYPES.ConfigurationService);
    this.databaseService = container.get<IDatabaseService>(SERVICETYPES.DatabaseService);

    // call initialize in the services:
    // ConfigurationService: load the configuration files
    // this: cors, bodyparser.json, bodyparser.urlencoded, express-session, static
    // EventService:  event emitting
    // UserService: calls its own seeder
    // CommentService: calls its own seeder. This requires that the users have been created
    // AuthenticationService: passport + authentication routes
    // SettingService: seed settings table
    // RouteService: other routes
    return this.configurationService.initialize(this.app)
      .then( configuration => {
        return this.databaseService
          .initialize(this.app)
          .then(db => {
            this.config();
            return Promise.all([
              container.get<IEventService>(SERVICETYPES.EventService).initialize(this.app),
              container.get<IUserService>(SERVICETYPES.UserService).initialize(this.app)
                .then(() => container.get<ICommentService>(SERVICETYPES.CommentService).initialize(this.app)),
              container.get<ISettingService>(SERVICETYPES.SettingService).initialize(this.app),
              container.get<IAuthenticationService>(SERVICETYPES.AuthenticationService).initialize(this.app)
            ]);
          })
          .then(all => container.get<IRouteService>(SERVICETYPES.RouteService).initialize(this.app)) // other routes
          .then(vp => Promise.resolve(this));
      })
      .catch(err => { throw err; });
  }

  public start(): void {
    const port = this.configurationService.environment.server.my2CentsPort;
    this.app.listen(port, () => {
        console.info(new Date() + ` Express server listening on port ${port}`);
      });
  }

  private checkOrigin(origin, callback) {
    // origin is allowed
    const hostname =
      container.get<IConfigurationService>(SERVICETYPES.ConfigurationService).environment.server.hostname;
    if (typeof origin === 'undefined' || `.${new URL(origin).hostname}`.endsWith(`.${hostname}`)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  }

  private config(): void {

    this.app.use(cors(
      {
        credentials: true,
        origin: this.checkOrigin
      })
    );

    // this.app.use(CookieParser());
    // support application/json type post data
    this.app.use(bodyParser.json());
    // support application/x-www-form-urlencoded post data
    this.app.use(bodyParser.urlencoded({ extended: false }));

    const sessionRepository = this.databaseService.getSessionRepository();
    this.app.use(expressSession(
      {
        cookie: {
          // this gives a problem in Edge
          // domain: this.configurationService.getMy2CentsDomain(),
          maxAge: 86400000,
          secure: this.configurationService.environment.server.protocol === 'https'
        },
        name: 'my2cents.session', // defaults to session.id,
        resave: true,
        saveUninitialized: false,
        secret: this.configurationService.application.secret,
        store: new TypeormStore(
          {
            cleanupLimit: 2,
            limitSubquery: false, // If using MariaDB.
            ttl: 86400
          }
        ).connect(sessionRepository)
     }
    ));
    this.configurationService.environment.server.serveStatic
      .forEach(value => this.app.use(express.static(value)));
  }
}

export default new App();
