import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';

import { ISubscriptionService } from '../services';
import SERVICETYPES from '../services/service.types';

export interface ISubscriptionController {
  subscribe(request: Request, response: Response): void;
  unsubscribe(request: Request, response: Response): void;
}

@injectable()
export class SubscriptionController implements ISubscriptionController {

  // constructor
  public constructor(
    @inject(SERVICETYPES.SubscriptionService) private subscriptionService: ISubscriptionService) { }

  // interface members
  public subscribe(request: Request, response: Response): void {
    const { endpoint, publicKey, auth } = request.body;

    this.subscriptionService
      .subscribe(endpoint, publicKey, auth)
      .then(subscription => response.send({ status: 'ok' }))
      .catch(err => {
        console.log(err);
        response.sendStatus(500);
      });
  }

  public unsubscribe(request: Request, response: Response): void {
    const { endpoint } = request.body;

    this.subscriptionService
      .unsubscribe(endpoint)
      .then(subscription => response.send({ status: 'ok' }))
      .catch(err => {
        console.log(err);
        response.sendStatus(500);
      });
  }
}
