import * as express from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';

import {
  ICommentController,
  IHomeController,
  ISettingController,
  ISubscriptionController,
  ISystemController,
  IUserController } from '../controllers';
import CONTROLLERTYPES from '../controllers/controller.types';

import { IService } from './service';

export interface IRouteService extends IService { }

@injectable()
export class RouteService implements IRouteService {

  // constructor
  public constructor(
    @inject(CONTROLLERTYPES.CommentController) private commentController: ICommentController,
    @inject(CONTROLLERTYPES.HomeController) private homeController: IHomeController,
    @inject(CONTROLLERTYPES.SettingController) private settingController: ISettingController,
    @inject(CONTROLLERTYPES.SubscriptionController) private subscriptionController: ISubscriptionController,
    @inject(CONTROLLERTYPES.SystemController) private systemController: ISystemController,
    @inject(CONTROLLERTYPES.UserController) private userController: IUserController
  ) { }

  // interface members
  public async initialize(app: express.Application): Promise<any> {
    const router = express.Router();
    router.all(
      '/hello',
      (request: express.Request, response: express.Response) => {
        this.homeController.helloWorld(request, response);
      }
    );

    // comments
    router.get(
      '/comments/:slug',
      (request: express.Request, response: express.Response) => {
        this.commentController.getComments(request, response);
      }
    );

    router.post(
      '/comments/:slug',
      (request: express.Request, response: express.Response) => {
        this.commentController.postComment(request, response);
      }
    );

    // feed
    router.get(
      '/feed',
      (request: express.Request, response: express.Response) => {
        this.commentController.getRssFeedForModeration(request, response);
      }
    );

    // single comment
    router.post(
      '/comment/:id/approve',
      (request: express.Request, response: express.Response) => {
        this.commentController.approveComment(request, response);
      }
    );

    router.post(
      '/comment/:id/reject',
      (request: express.Request, response: express.Response) => {
          this.commentController.rejectComment(request, response);
      }
    );

    router.post(
      '/markdown',
      (request: express.Request, response: express.Response) => {
        this.commentController.markdown2Html(request, response);
      }
    );

    // user
    router.post(
      '/user/:id/block',
      (request: express.Request, response: express.Response) => {
          this.userController.blockUser(request, response);
      }
    );

    router.post(
      '/user/:id/trust',
      (request: express.Request, response: express.Response) => {
          this.userController.trustUser(request, response);
      }
    );

    // subscribe - unsubscribe
    router.post(
      '/subscribe',
      (request: express.Request, response: express.Response) => {
        this.subscriptionController.subscribe(request, response);
      }
    );

    router.post(
      '/unsubscribe',
      (request: express.Request, response: express.Response) => {
        this.subscriptionController.subscribe(request, response);
      }
    );

    // vapid key
    router.get(
      '/vapidData',
      (request: express.Request, response: express.Response) => {
        this.systemController.getVapidData(request, response);
      }
    )

    // settings
    router.get(
      '/setting/:key',
      (request: express.Request, response: express.Response) => {
        this.settingController.getSetting(request, response);
      }
    )

    router.post(
      '/setting/:key/:value',
      (request: express.Request, response: express.Response) => {
        this.settingController.setSetting(request, response);
      }
    );

    app.use(router);

    return Promise.resolve(true);
  }
}
