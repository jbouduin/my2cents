import * as express from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';

import { ICommentController, IHomeController, ISubscriptionController, IUserController } from '../controllers';
import CONTROLLERTYPES from '../controllers/controller.types';

import { IService } from './service';

export interface IRouteService extends IService { }

@injectable()
export class RouteService implements IRouteService {

  // constructor
  public constructor(
    @inject(CONTROLLERTYPES.CommentController) private commentController: ICommentController,
    @inject(CONTROLLERTYPES.HomeController) private homeController: IHomeController,
    @inject(CONTROLLERTYPES.SubscriptionController) private subscriptionController: ISubscriptionController,
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

    router.get(
      '/feed',
      (request: express.Request, response: express.Response) => {
        this.commentController.getRssFeedForModeration(request, response);
      }
    );

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

    app.use(router);

    return Promise.resolve(true);
  }
}
