import * as bodyParser from 'body-parser';
import { TypeormStore } from 'connect-typeorm';
import * as cors from 'cors';
import * as express from 'express';
import * as expressSession from 'express-session';
/* import * as CookieParser from 'cookie-parser'; */

import { Session } from './db/entities';

import container from './inversify.config';
import {
  IAuthenticationService,
  IConfigurationService,
  IDatabaseService,
  IEventService,
  IRouteService,
  IUserService,
  IVapidService } from './services';
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
    return this.configurationService.initialize(this.app)  // load the configuration files
      .then( configuration => {
        return this.databaseService
          .initialize(this.app) // create the database connections
          .then(db => {
            this.config(); // cors, bodyparser.json, bodyparser.urlencoded, express-session, static
            return Promise.all([
              container.get<IEventService>(SERVICETYPES.EventService).initialize(this.app), // event emitting
              container.get<IUserService>(SERVICETYPES.UserService).initialize(this.app), // create default users
              container.get<IAuthenticationService>(SERVICETYPES.AuthenticationService).initialize(this.app), // passport + authentication routes
              // container.get<IVapidService>(SERVICETYPES.VapidService).initialize(this.app)
            ]);
          })
          .then(all => container.get<IRouteService>(SERVICETYPES.RouteService).initialize(this.app)) // other routes
          .then(vp => Promise.resolve(this));
      })
      .catch(err => { throw err; });
  }

  public start(): void {
    const port = this.configurationService.environment.server.port;
    this.app.listen(port, () => {
        console.log(new Date() + ` Express server listening on port ${port}`);
      });
  }

  private config(): void {
    // container.get<IVapidService>(SERVICETYPES.VapidService).initialize(this.app);

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

  public checkOrigin(origin, callback) {
      // origin is allowed
      let hostname = container.get<IConfigurationService>(SERVICETYPES.ConfigurationService).environment.server.hostname;
      if (
          typeof origin === 'undefined' ||
          `.${new URL(origin).hostname}`.endsWith(`.${hostname}`)
      ) {
          return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
  }
}

export default new App();
