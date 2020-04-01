import { Application } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';

import { Comment, User } from '../db/entities';

import { IConfigurationService} from './configuration.service';
import { IDatabaseService } from './database.service';
import { IService } from './service';

import SERVICETYPES from '../services/service.types';

export interface IUserService extends IService {
  blockUser(userId: number): Promise<User>;
  createUser(
    provider: string,
    providerId: string,
    displayName: string,
    name: string,
    url: string): Promise<User>;
  findUser(provider: string, providerId: string): Promise<User>;
  trustUser(userId: number): Promise<User>;
}

@injectable()
export class UserService implements IUserService {

  // constructor
  public constructor(
    @inject(SERVICETYPES.ConfigurationService) private configurationService: IConfigurationService,
    @inject(SERVICETYPES.DatabaseService) private databaseService: IDatabaseService) { }

  // interface members
  public async blockUser(userId: number): Promise<User> {
    const userRepository = this.databaseService.getUserRepository();
    const user = await userRepository.findOne(userId);
    user.trusted = false;
    user.blocked = true;
    return userRepository.save(user);
  }

  public async initialize(app: Application): Promise<any> {
    const repository = this.databaseService.getUserRepository();
    const searches = new Array<Promise<number>>();

    searches.push(repository.count({ where: { administrator: true } }));
    if (this.configurationService.environment.authentication.allowAnonymous) {
      searches.push(
        repository.count(
          {
            where: { provider: 'local', provider_id: 'Anonymous' }
          }
        )
      );
    }

    return Promise.all(searches)
      .then((counts: Array<number>) => {
        const newUsers = new Array<User>();
        if (counts[0] === 0) {
          console.log('creating an administrator');
          newUsers.push(repository.create(
            {
              administrator: true,
              blocked: false,
              display_name: 'Administrator',
              name: 'Administrator',
              provider: 'local',
              provider_id: 'Administrator',
              trusted: true,
              ip_address: '127.0.0.1',
              user_agent: 'My2Cents-Server'
            }
          ));
        } else {
          console.log('found an administrator');
        }
        if (this.configurationService.environment.authentication.allowAnonymous) {
          if (counts[1] === 0) {
            newUsers.push(repository.create(
              {
                administrator: false,
                blocked: false,
                display_name: 'Anonymous user',
                name: 'Anonymous',
                provider: 'local',
                provider_id: 'Anonymous',
                trusted: true,
                ip_address: '127.0.0.1',
                user_agent: 'My2Cents-Server'
              }
            ));
            console.log('creating an anonymous user');
          } else {
            console.log('found an anonymous user');
          }
        } else {
          console.log('no anonymous user needed');
        }
        if (newUsers.length > 0) {
          repository.save(newUsers);
        }
      });
  }

  public async createUser(
    provider: string,
    providerId: string,
    displayName: string,
    name: string,
    url: string): Promise<User> {

    const repository = this.databaseService.getUserRepository();
    const newUser = new User();
    newUser.provider = provider;
    newUser.provider_id = providerId;
    newUser.display_name = displayName;
    newUser.name = name;
    newUser.url = url;
    newUser.trusted = false;
    newUser.blocked = false;
    newUser.administrator = false;
    newUser.ip_address = 'unknown';
    newUser.user_agent = 'unknown';
    return repository.save(newUser);
  }

  public async findUser(provider: string, providerId: string): Promise<User> {
    // SELECT id, name, display_name, provider, provider_id,
    //      trusted, blocked FROM user
    //    WHERE provider = ? AND provider_id = ?
    return this.databaseService.getUserRepository().createQueryBuilder('user')
      .select()
      .where('user.provider = :provider', { provider })
      .andWhere('user.provider_id = :providerId', { providerId })
      .getOne();
  }

  public async trustUser(userId: number): Promise<User> {
    const userRepository = this.databaseService.getUserRepository();
    const user = await userRepository.findOne(userId);
    user.trusted = true;
    user.blocked = false;
    return userRepository.save(user);
  }
}
