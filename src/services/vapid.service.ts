import { Application, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
var expressModifyResponse = require('express-modify-response');

import { IConfigurationService} from './configuration.service';
import { IService } from './service';

import SERVICETYPES from '../services/service.types';

export interface IVapidService extends IService {
}

@injectable()
export class VapidService implements IVapidService {

  // constructor
  public constructor(@inject(SERVICETYPES.ConfigurationService) private configurationService: IConfigurationService) {
  }

  // interface members
  public async initialize(app: Application): Promise<any> {
    if (this.configurationService.environment.notification.webpush.publicKey) {
      app.use(expressModifyResponse(this.checkRequest, this.modifyBody));
    }
    return Promise.resolve(true);
  }

  // private methods
  checkRequest(request: Request, response: Response) {
    if (request.path === '/push.js') {
      console.log(`will modify ${request.path}`)
      return true;
    }
    console.log(`will not modify ${request.path}`)
    return false;
  }

  modifyBody(request: Request, response: Response, body) {
    console.log(`modifying ${request.path}`);
    if (request.path === '/push.js') {
      return body
        .toString()
        .replace('%VAPID_PUBLIC_KEY%', this.configurationService.environment.notification.webpush.publicKey)
        .replace('%MY2CENTS_HOST%', this.configurationService.environment.server.hostname);
    }
    return body.toString();
  }
}
