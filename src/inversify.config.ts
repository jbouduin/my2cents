import { Container } from 'inversify';

import CONSUMERTYPES from './consumers/consumer.types';
import CONTROLLERTYPES from './controllers/controller.types';
import SEEDERTYPES from './db/seeders/seeder.types';
import SERVICETYPES from './services/service.types';

/* tslint:disable ordered-imports */
// consumers
import { IPushConsumer, PushConsumer } from './consumers';
import { ISendMailConsumer, SendMailConsumer } from './consumers';
import { ISlackConsumer, SlackConsumer } from './consumers';
import { IWriteLogConsumer, WriteLogConsumer } from './consumers';

// controllers
import { ICommentController, CommentController } from './controllers';
import { IHomeController, HomeController } from './controllers';
import { ISettingController, SettingController } from './controllers';
import { ISubscriptionController, SubscriptionController } from './controllers';
import { ISystemController, SystemController } from './controllers';
import { IUserController, UserController } from './controllers';

// services
import { IAuthenticationService, AuthenticationService } from './services';
import { ICommentService, CommentService } from './services';
import { IDatabaseService, DatabaseService } from './services';
import { IEventService, EventService } from './services';
import { IConfigurationService, ConfigurationService } from './services';
import { IRouteService, RouteService } from './services';
import { ISettingService, SettingService } from './services';
import { ISubscriptionService, SubscriptionService } from './services';
import { IUserService, UserService } from './services';

// seeders
import { ICommentSeeder, CommentSeeder } from './db/seeders';
import { IUserSeeder, UserSeeder } from './db/seeders';

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
container.bind<ISettingController>(CONTROLLERTYPES.SettingController).to(SettingController);
container.bind<ISubscriptionController>(CONTROLLERTYPES.SubscriptionController).to(SubscriptionController);
container.bind<ISystemController>(CONTROLLERTYPES.SystemController).to(SystemController);
container.bind<IUserController>(CONTROLLERTYPES.UserController).to(UserController);

// services
container.bind<IAuthenticationService>(SERVICETYPES.AuthenticationService).to(AuthenticationService).inSingletonScope();
container.bind<ICommentService>(SERVICETYPES.CommentService).to(CommentService);
container.bind<IConfigurationService>(SERVICETYPES.ConfigurationService).to(ConfigurationService).inSingletonScope();
container.bind<IDatabaseService>(SERVICETYPES.DatabaseService).to(DatabaseService).inSingletonScope();
container.bind<IEventService>(SERVICETYPES.EventService).to(EventService).inSingletonScope();
container.bind<IRouteService>(SERVICETYPES.RouteService).to(RouteService).inSingletonScope();
container.bind<ISettingService>(SERVICETYPES.SettingService).to(SettingService);
container.bind<ISubscriptionService>(SERVICETYPES.SubscriptionService).to(SubscriptionService);
container.bind<IUserService>(SERVICETYPES.UserService).to(UserService);

// seeders
container.bind<ICommentSeeder>(SEEDERTYPES.CommentSeeder).to(CommentSeeder);
container.bind<IUserSeeder>(SEEDERTYPES.UserSeeder).to(UserSeeder);

export default container;
