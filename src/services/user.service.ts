import { Application } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { Repository } from 'typeorm';

import { Comment, User } from '../db/entities';
import { IUserSeeder } from '../db/seeders';

import { IConfigurationService} from './configuration.service';
import { IDatabaseService } from './database.service';
import { IService } from './service';

import SEEDERTYPES from '../db/seeders/seeder.types';
import SERVICETYPES from './service.types';

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
    @inject(SERVICETYPES.DatabaseService) private databaseService: IDatabaseService,
    @inject(SEEDERTYPES.UserSeeder) private userSeeder: IUserSeeder) { }

  // interface members
  public async blockUser(userId: number): Promise<User> {
    const userRepository = this.databaseService.getUserRepository();
    const user = await userRepository.findOne(userId);
    user.trusted = false;
    user.blocked = true;
    return userRepository.save(user);
  }

  public async initialize(app: Application): Promise<any> {
    console.debug('initializing UserService');
    return this.userSeeder.seed();
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
    newUser.providerId = providerId;
    newUser.displayName = displayName;
    newUser.name = name;
    newUser.url = url;
    newUser.trusted = false;
    newUser.blocked = false;
    newUser.administrator = false;
    newUser.ipAddress = 'unknown';
    newUser.userAgent = 'unknown';
    return repository.save(newUser);
  }

  public async findUser(provider: string, providerId: string): Promise<User> {
    // SELECT id, name, display_name, provider, provider_id,
    //      trusted, blocked FROM user
    //    WHERE provider = ? AND provider_id = ?
    return this.databaseService.getUserRepository().createQueryBuilder('user')
      .select()
      .where('user.provider = :provider', { provider })
      .andWhere('user.providerId = :providerId', { providerId })
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
