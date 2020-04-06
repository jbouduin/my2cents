import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';

import { IConfigurationService } from '../services';

import SERVICETYPES from '../services/service.types';

export interface ISystemController {
  getVapidData(request: Request, response: Response): void;
}

@injectable()
export class SystemController implements ISystemController {

  // constructor
  public constructor(
    @inject(SERVICETYPES.ConfigurationService) private configurationService: IConfigurationService) {
  }

  // interface members
  public getVapidData(request: Request, response: Response): void {
    response.send({ key: this.configurationService.environment.notification.webpush.publicKey });
  }
}
