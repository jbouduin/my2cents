import { inject, injectable } from 'inversify';
import { Repository } from 'typeorm';

import { IConfigurationService, IDatabaseService } from '../../services';

import { User, UserStatus } from '../entities';
import { ISeeder, Seeder } from './seeder';

import SERVICETYPES from '../../services/service.types';

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
        .count({ where: { provider: 'local', providerId: 'Anonymous'.toLowerCase() } })
        .then(cnt => {
          if (cnt === 0) {
            console.info('creating \'Anonymous\'');
            return this.createSeededUser(
              repository,
              'Anonymous',
              UserStatus.INITIAL
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
              UserStatus.ADMINISTRATOR
            );
          }
        })
      );

      // seed 'Good Boy'
      seedingData.push(repository
        .count({ where: { provider: 'local', providerId: 'Good boy'.toLowerCase() } })
        .then(cnt => {
          if (cnt === 0) {
            console.info('creating \'Good boy\'');
            return this.createSeededUser(
              repository,
              'Good boy',
              UserStatus.TRUSTED
            );
          }
        })
      );

      // seed 'Naughty Girl'
      seedingData.push(repository
        .count({ where: { provider: 'local', providerId: 'Naughty girl'.toLowerCase() } })
        .then(cnt => {
          if (cnt === 0) {
            console.info('creating \'Naughty girl\'');
            return this.createSeededUser(
              repository,
              'Naughty girl',
              UserStatus.INITIAL
            );
          }
        })
      );

      // seed 'Bad Boy'
      seedingData.push(repository
        .count({ where: { provider: 'local', providerId: 'Bad boy'.toLowerCase() } })
        .then(cnt => {
          if (cnt === 0) {
            console.info('creating \'Bad boy\'');
            return this.createSeededUser(
              repository,
              'Bad boy',
              UserStatus.BLOCKED
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
    status: UserStatus
  ): User {
    return repository.create({
      displayName: name,
      ipAddress: this.ipAddress,
      localPassword: name.toLowerCase(),
      name: name.toLowerCase(),
      provider: 'local',
      providerId: name.toLowerCase(),
      status,
      userAgent: this.userAgent
    });
  }
}
