import { inject, injectable } from 'inversify';
import { Repository } from 'typeorm';

import { IConfigurationService, IDatabaseService } from '../../services';

import { User } from '../entities';
import SERVICETYPES from '../../services/service.types';

import { ISeeder, Seeder } from './seeder';

export interface IUserSeeder extends ISeeder { }

interface ISeed {
  key: string;
  value: Promise<number>
}

@injectable()
export class UserSeeder extends Seeder implements IUserSeeder {

  // constructor
  public constructor(
    @inject(SERVICETYPES.ConfigurationService) private configurationService: IConfigurationService,
    @inject(SERVICETYPES.DatabaseService) private databaseService: IDatabaseService) {
    super();
  }

  // interface methods
  public async seed(): Promise<Array<User>> {
    const repository = this.databaseService.getUserRepository();

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
        return repository.save(toCreate);
      } else {
        console.info('User table already seeded');
        return Promise.resolve(new Array<User>());
      }
    });
  }

  // private helper methods
  private createSeededUser(
    repository: Repository<User>,
    name: string,
    administrator: boolean,
    trusted: boolean,
    blocked: boolean
  ): User {
    return repository.create({
      administrator,
      blocked,
      display_name: name,
      ip_address: this.ipAddress,
      local_password: name.toLowerCase(),
      name: name.toLowerCase(),
      provider: 'local',
      provider_id: name.toLowerCase(),
      trusted,
      user_agent: this.userAgent
    });
  }
}
