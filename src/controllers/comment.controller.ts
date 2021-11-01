import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
// import * as domPurify from 'domPurify';
import * as marked from 'marked';
import 'reflect-metadata';
import * as rss from 'rss';
// import '../types.d.ts';

import { CommentApprovedEvent, CommentPostedEvent, CommentRejectedEvent } from '../objects/events';
import { IAuthenticationService, ICommentService, IConfigurationService, IEventService , ISettingService} from '../services';

import { Comment, CommentStatus, Setting, User, UserStatus } from '../db/entities';
import { DtoComment, DtoUser } from '../objects/data-transfer';

import SETTINGKEYS from '../objects/settings/setting.keys';
import SERVICETYPES from '../services/service.types';

declare module "express-session" {
  interface Session {
    user: User;
  }
}

export interface ICommentController {
  approveComment(request: Request, response: Response): void;
  getComments(request: Request, response: Response): void;
  getRssFeedForModeration(request: Request, response: Response): void;
  markdown2Html(request: Request, response: Response): void;
  postComment(request: Request, response: Response): void;
  rejectComment(request: Request, response: Response): void;
}

@injectable()
export class CommentController implements ICommentController {
  // constructor
  public constructor(
    @inject(SERVICETYPES.AuthenticationService) private authenticationService: IAuthenticationService,
    @inject(SERVICETYPES.ConfigurationService) private configurationService: IConfigurationService,
    @inject(SERVICETYPES.CommentService) private commentService: ICommentService,
    @inject(SERVICETYPES.EventService) private eventService: IEventService,
    @inject(SERVICETYPES.SettingService) private settingService: ISettingService) {
  }

  // interface members
  public approveComment(request: Request, response: Response): void  {
    if (!request.isAuthenticated()) {
      response.sendStatus(401);
    } else {

      if (request.session.user.status !== UserStatus.ADMINISTRATOR) {
        response.sendStatus(403);
      } else {
        const commentId = Number(request.params.id);
        if (isNaN(commentId)) {
          response.sendStatus(400);
        } else {
          this.commentService
            .approveComment(commentId)
            .then(comment => {
              this.eventService.postEvent(new CommentApprovedEvent(comment));
              response.send({ status: 'ok' });
            })
            .catch(err => {
              console.error(err);
              response.sendStatus(500);
            });
        }
      }
    }
  }

  public getComments(request: Request, response: Response): void {
    const slug = request.params.slug;

    let dtoUser: DtoUser = null;
    let userId = 0;
    if (request.session?.user) {
      dtoUser = new DtoUser();
      dtoUser.id = request.session.user.id;
      dtoUser.name = request.session.user.displayName || request.session.user.name;
      dtoUser.admin = request.session.user.status === UserStatus.ADMINISTRATOR;
      userId = request.session.user.id;
    }

    Promise.all<Array<Comment>, Setting>([
      this.commentService.getCommentsBySlug(slug, userId, dtoUser && dtoUser.admin),
      this.settingService.getSetting(SETTINGKEYS.Push)
    ]).then( ([comments, setting]) => {
        const notification = dtoUser && dtoUser.admin ? JSON.parse(setting.setting) : null;
        const dtoComments = this.transformComments(comments, dtoUser);

        response.send(
          {
            auth: dtoUser ?
              null :
              this.authenticationService.getProviders(),
            comments: dtoComments,
            notification,
            slug,
            user: dtoUser
          }
        );
      });
  }

  public getRssFeedForModeration(request: Request, response: Response): void {
    if (!request.isAuthenticated()) {
      response.sendStatus(401);
    } else {
      if (request.session.user.status !== UserStatus.ADMINISTRATOR) {
        response.sendStatus(403);
      } else {
        const commentId = Number(request.params.id);
        if (isNaN(commentId)) {
          response.sendStatus(400);
        } else {
          this.commentService
            .getCommentsForModeration()
            .then(comments => {
              const feed = new rss({
                site_url: this.configurationService.getMy2CentsUrl(),
                title: 'Awaiting moderation'
              });
              console.debug(feed);
              comments.forEach(comment => {
                feed.item({
                  date: comment.created,
                  description: `A new comment on '${comment.slug}' is awaiting moderation`,
                  guid: comment.slug + '/' + comment.id,
                  title: `New comment on '${comment.slug}'`,
                  url: comment.slug + '/' + comment.id
                });
              });
              response.send(feed.xml({ indent: true }));
            })
            .catch(err => {
              console.error(err);
              response.sendStatus(500);
            });
        }
      }
    }
  }

  public markdown2Html(request: Request, response: Response): void {
    const comment = request.body.comment;
    const dirty = marked(comment.trim());
    // BUG: (#612) dompurify is not a function error
    // response.send({ html: domPurify.sanitize(dirty) });
    response.send({ html: dirty });
  }

  public postComment(request: Request, response: Response): void {
    if (!request.isAuthenticated()) {
      response.sendStatus(401);
    } else {
      this.commentService
        .getLastComment(
          request.session.user.id,
          request.body.replyTo,
          request.params.slug)
        .then(lastComment => {
          if (lastComment && lastComment.comment === request.body.comment) {
            response.send({ status: 'rejected', reason: 'reason' });
          } else {
            this.commentService.createComment(
              request.session.user,
              request.body.replyTo === undefined ? null : request.body.replyTo,
              request.params.slug,
              request.body.comment,
              this.getCallerIP(request),
              request.get('user-agent')
            )
            .then(result => {
              this.eventService.postEvent(new CommentPostedEvent(result));
              response.send({ status: 'ok', id: result.id });
            })
            .catch(err => {
              console.error(err);
              response.sendStatus(500);
            });
          }
        });
    }
  }

  public rejectComment(request: Request, response: Response): void  {
    if (!request.isAuthenticated()) {
      response.sendStatus(401);
    } else {
      if (request.session.user.status !== UserStatus.ADMINISTRATOR) {
        response.sendStatus(403);
      } else {
        const commentId = Number(request.params.id);
        if (isNaN(commentId)) {
          response.sendStatus(400);
        } else {
          this.commentService
            .rejectComment(commentId)
            .then(comment => {
              this.eventService.postEvent(new CommentRejectedEvent(comment));
              response.send({ status: 'ok' });
            })
            .catch(err => {
              console.error(err);
              response.sendStatus(500);
            });
        }
      }
    }
  }

  // private helper methods
  private transformComments(comments: Array<Comment>, dtoUser: DtoUser): Array<DtoComment> {
    return comments.map(comment => {
      const dtoComment = new DtoComment();
      // properties that are always set
      dtoComment.id = comment.id;
      dtoComment.replyTo = comment.replyTo;
      dtoComment.author = comment.user.displayName || comment.user.name;
      dtoComment.authorUrl = this.getAuthorUrl(
        comment.user.url,
        comment.user.provider,
        comment.user.name);
      dtoComment.comment = marked(comment.comment.trim());
      dtoComment.created = this.configurationService.formatDate(comment.created);

      // user.id: only set if administrator
      dtoComment.authorId = dtoUser?.admin ? comment.user.id : null;
      // user.status in ('trusted', 'administrator') or commend.status = 'approved' and logged in
      dtoComment.canReply = dtoUser &&
        (comment.user.status === UserStatus.TRUSTED ||
        comment.user.status === UserStatus.ADMINISTRATOR ||
        comment.status === CommentStatus.APPROVED);
      // user.id = comment.user.id
      dtoComment.own = comment.user.id === dtoUser?.id;
      // comment.status: only set if administrator or when own comment
      dtoComment.status = dtoComment.own || dtoUser?.admin ?
        comment.status :
        null;
      // user.status: only set if administrator or when own comment
      dtoComment.authorStatus = dtoComment.own || dtoUser?.admin ?
        comment.user.status :
        null;

      return dtoComment;
    });
  }

  private getAuthorUrl(userUrl: string, provider: string, name: string): string {
    if (userUrl) {
      return userUrl;
    }
    switch (provider) {
      case 'twitter':
        return 'https://twitter.com/' + name;
      case 'github':
        return 'https://github.com/' + name;
    }
    return null;
  }

  private getCallerIP(request: Request): string {
    let ip = request.get('x-forwarded-for') ||
        request.socket.remoteAddress;
    ip = ip.split(',')[0];
    // in case the ip returned in a format: "::ffff:146.xxx.xxx.xxx"
    ip = ip.split(':').pop();
    return ip || 'unknown';
  }
}
