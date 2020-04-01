import { Application } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { DeleteResult } from 'typeorm';

import { Subscription } from '../db/entities';

import { IDatabaseService } from './database.service';
import { IService } from './service';

import SERVICETYPES from './service.types';

export interface ISubscriptionService extends IService {
  getSubscriptions(): Promise<Array<Subscription>>;
  subscribe(endpoint: string, publicKey: string, auth: string): Promise<Subscription>;
  unsubscribe(endpoint: string): Promise<DeleteResult>;
}

@injectable()
export class SubscriptionService implements ISubscriptionService {

  // constructor
  public constructor(
    @inject(SERVICETYPES.DatabaseService) private databaseService: IDatabaseService) { }

  // interface methods
  public async initialize(app: Application): Promise<any> {
    return Promise.resolve(true);
  }

  public async getSubscriptions(): Promise<Array<Subscription>> {
    return this.databaseService
      .getSubscriptionRepository()
      .createQueryBuilder('subscription')
      .getMany();
  }

  public async subscribe(endpoint: string, publicKey: string, auth: string): Promise<Subscription> {

    const subscriptionRepository = this.databaseService.getSubscriptionRepository();
    const newSubscription = await subscriptionRepository.create(
      {
        auth,
        endpoint,
        publicKey
      }
    );
    return subscriptionRepository.save(newSubscription);
  }

  public async unsubscribe(endpoint: string): Promise<DeleteResult> {
    const subscriptionRepository = this.databaseService.getSubscriptionRepository();
    return subscriptionRepository.delete(endpoint);
  }
}
