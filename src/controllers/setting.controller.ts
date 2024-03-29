import { User, UserStatus } from '../db/entities';
import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';

import { ISettingService } from '../services';

import SERVICETYPES from '../services/service.types';

declare module "express-session" {
  interface Session {
    user: User;
  }
}
export interface ISettingController {
  getSetting(request: Request, response: Response): void;
  setSetting(request: Request, response: Response): void;
}

@injectable()
export class SettingController implements ISettingController {

  // constructor
  public constructor(
    @inject(SERVICETYPES.SettingService) private settingService: ISettingService) {
  }

  // interface members
  public getSetting(request: Request, response: Response): void {
    if (!request.isAuthenticated()) {
      response.sendStatus(401);
    } else {
      const key = request.params.key;
      this.settingService.getSetting(key)
        .then(setting => response.send(setting))
        .catch(err => {
          console.error(err);
          response.sendStatus(500);
        });
    }
  }

  public setSetting(request: Request, response: Response): void {
    if (!request.isAuthenticated()) {
      response.sendStatus(401);
    } else {
      if (request.session.user.status !== UserStatus.ADMINISTRATOR) {
        response.sendStatus(403);
      } else {
        this.settingService.setSetting(request.params.key, request.params.value)
          .then(setting => response.send({ status: 'ok' }))
          .catch(err => {
            console.error(err);
            response.sendStatus(500);
          });
      }
    }
  }
}
