import { Application } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { Repository } from 'typeorm';

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

interface ISeed {
  key: string;
  value: Promise<number>
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
    this.seed();
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

  // private helper methods
  private async seed(): Promise<any> {
    const repository = this.databaseService.getUserRepository();
    //const searches = new Array<ISeed>();

    const seedingData = new Array<Promise<User>>();
    if (this.configurationService.environment.authentication.allowAnonymous) {
      seedingData.push(repository
        .count({ where: { provider: 'local', provider_id: 'Anonymous'.toLowerCase() } })
        .then(cnt => {
          if (cnt === 0) {
            console.info('creating \'Anonymous\'');
            return this.createSeededUser(
              repository,
              'Anonymous',
              false,
              false,
              false
            );
          }
        })
      );
    }

    if (this.configurationService.environment.authentication.allowLocal) {
      // seed the Administrator
      seedingData.push(repository
        .count({ where: { administrator: true } })
        .then(cnt => {
          if (cnt === 0) {
            console.info('creating \'Administrator\'');
            return this.createSeededUser(
              repository,
              'Administrator',
              true,
              true,
              false
            );
          }
        })
      );

      // seed 'Good Boy'
      seedingData.push(repository
        .count({ where: { provider: 'local', provider_id: 'Good boy'.toLowerCase() } })
        .then(cnt => {
          if (cnt === 0) {
            console.info('creating \'Good boy\'');
            return this.createSeededUser(
              repository,
              'Good boy',
              false,
              true,
              false
            );
          }
        })
      );

      // seed 'Naughty Girl'
      seedingData.push(repository
        .count({ where: { provider: 'local', provider_id: 'Naughty girl'.toLowerCase() } })
        .then(cnt => {
          if (cnt === 0) {
            console.info('creating \'Naughty girl\'');
            return this.createSeededUser(
              repository,
              'Naughty girl',
              false,
              false,
              false
            );
          }
        })
      );

      // seed 'Bad Boy'
      seedingData.push(repository
        .count({ where: { provider: 'local', provider_id: 'Bad boy'.toLowerCase() } })
        .then(cnt => {
          if (cnt === 0) {
            console.info('creating \'Bad boy\'');
            return this.createSeededUser(
              repository,
              'Bad boy',
              false,
              false,
              true
            );
          }
        })
      );
    }

    return Promise.all(seedingData).then(newUsers => {
      const toCreate = newUsers.filter(newUser => newUser);
      if (toCreate.length > 0) {
        console.debug('writing new users to database');
        repository.save(toCreate);
      } else {
        console.info('User table already seeded');
      }
    });
  }

  private createSeededUser(
    repository: Repository<User>,
    name: string,
    administrator: boolean,
    trusted: boolean,
    blocked: boolean
  ): User {
    return repository.create({
      administrator: administrator,
      blocked: blocked,
      display_name: name,
      ip_address: '127.0.0.1',
      local_password: name.toLowerCase(),
      name: name,
      provider: 'local',
      provider_id: name.toLowerCase(),
      trusted: trusted,
      user_agent: 'My2Cents-Server'
    });
  }
}
