import { User, UserStatus } from '../db/entities';
import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';

import { IUserService } from '../services';
import SERVICETYPES from '../services/service.types';

declare module "express-session" {
  interface Session {
    user: User;
  }
}

export interface IUserController {
  blockUser(request: Request, response: Response): void;
  trustUser(request: Request, response: Response): void;
}

@injectable()
export class UserController implements IUserController {

  // constructor
  public constructor(
    @inject(SERVICETYPES.UserService) private userService: IUserService
  ) { }

  // interface members
  public blockUser(request: Request, response: Response): void {
    if (!request.isAuthenticated()) {
      response.sendStatus(401);
    } else {
      if (request.session.user.status !== UserStatus.ADMINISTRATOR) {
        response.sendStatus(403);
      } else {
        const userId = Number(request.params.id);
        if (isNaN(userId)) {
          response.sendStatus(400);
        } else {
          this.userService.blockUser(userId)
            .then(user => response.send({ status: 'ok' }))
            .catch(err => {
              console.error(err);
              response.sendStatus(500);
            });
        }
      }
    }
  }

  public trustUser(request: Request, response: Response): void {
    if (!request.isAuthenticated()) {
      response.sendStatus(401);
    } else {
      if (request.session.user.status !== UserStatus.ADMINISTRATOR) {
        response.sendStatus(403);
      } else {
        const userId = Number(request.params.id);
        if (isNaN(userId)) {
          response.sendStatus(400);
        } else {
          this.userService.trustUser(userId)
            .then(user => response.send({ status: 'ok' }))
            .catch(err => {
              console.error(err);
              response.sendStatus(500);
            });
        }
      }
    }
  }
}
