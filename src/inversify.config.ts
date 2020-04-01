import { Container } from 'inversify';

import CONTROLLERTYPES from './controllers/controller.types';
import CONSUMERTYPES from './events/consumers/consumer.types';
import SERVICETYPES from './services/service.types';

/* tslint:disable ordered-imports */
// consumers

import { IPushConsumer, PushConsumer } from './events/consumers';
import { ISendMailConsumer, SendMailConsumer } from './events/consumers';
import { ISlackConsumer, SlackConsumer } from './events/consumers';
import { IWriteLogConsumer, WriteLogConsumer } from './events/consumers';

// controllers
import { ICommentController, CommentController } from './controllers';
import { IHomeController, HomeController } from './controllers';
import { ISubscriptionController, SubscriptionController } from './controllers';
import { IUserController, UserController } from './controllers';

// services
import { IAuthenticationService, AuthenticationService } from './services';
import { ICommentService, CommentService } from './services';
import { IDatabaseService, DatabaseService } from './services';
import { IEventService, EventService } from './services';
import { IConfigurationService, ConfigurationService } from './services';
import { IRouteService, RouteService } from './services';
import { ISubscriptionService, SubscriptionService } from './services';
import { IUserService, UserService } from './services';
import { IVapidService, VapidService} from './services';
/* tslint:enable ordered-imports */

const container = new Container();

// Consumers
container.bind<IPushConsumer>(CONSUMERTYPES.PushConsumer).to(PushConsumer).inSingletonScope();
container.bind<ISendMailConsumer>(CONSUMERTYPES.SendMailConsumer).to(SendMailConsumer).inSingletonScope();
container.bind<ISlackConsumer>(CONSUMERTYPES.SlackConsumer).to(SlackConsumer).inSingletonScope();
container.bind<IWriteLogConsumer>(CONSUMERTYPES.WriteLogConsumer).to(WriteLogConsumer).inSingletonScope();
// controllers
container.bind<ICommentController>(CONTROLLERTYPES.CommentController).to(CommentController);
container.bind<IHomeController>(CONTROLLERTYPES.HomeController).to(HomeController);
container.bind<ISubscriptionController>(CONTROLLERTYPES.SubscriptionController).to(SubscriptionController);
container.bind<IUserController>(CONTROLLERTYPES.UserController).to(UserController);

// services
container.bind<IAuthenticationService>(SERVICETYPES.AuthenticationService).to(AuthenticationService).inSingletonScope();
container.bind<ICommentService>(SERVICETYPES.CommentService).to(CommentService);
container.bind<IConfigurationService>(SERVICETYPES.ConfigurationService).to(ConfigurationService).inSingletonScope();
container.bind<IDatabaseService>(SERVICETYPES.DatabaseService).to(DatabaseService).inSingletonScope();
container.bind<IEventService>(SERVICETYPES.EventService).to(EventService).inSingletonScope();
container.bind<IRouteService>(SERVICETYPES.RouteService).to(RouteService).inSingletonScope();
container.bind<ISubscriptionService>(SERVICETYPES.SubscriptionService).to(SubscriptionService);
container.bind<IUserService>(SERVICETYPES.UserService).to(UserService);
container.bind<IVapidService>(SERVICETYPES.VapidService).to(VapidService).inSingletonScope();
export default container;
