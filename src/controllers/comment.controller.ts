import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
// import * as domPurify from 'domPurify';
import * as marked from 'marked';
import 'reflect-metadata';
import * as rss from 'rss';

import { CommentApprovedEvent, CommentPostedEvent, CommentRejectedEvent } from '../objects/events';
import { IAuthenticationService, ICommentService, IConfigurationService, IEventService , ISettingService} from '../services';

import { Comment, CommentStatus, Setting, UserStatus } from '../db/entities';
import { DtoComment, DtoUser } from '../objects/data-transfer';

import SETTINGKEYS from '../objects/settings/setting.keys';
import SERVICETYPES from '../services/service.types';

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
      if (!request.session.passport.user.administrator) {
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
    if (request.session && request.session.passport && request.session.passport.user) {
      dtoUser = new DtoUser();
      dtoUser.name = request.session.passport.user.displayName || request.session.passport.user.name;
      dtoUser.admin = request.session.passport.user.administrator;
      userId = request.session.passport.user.id;
    }

    Promise.all<Array<Comment>, Setting>([
      this.commentService.getCommentsBySlug(slug, userId, dtoUser && dtoUser.admin),
      this.settingService.getSetting(SETTINGKEYS.Push)
    ]).then( ([comments, setting]) => {
        const notification = dtoUser && dtoUser.admin ? JSON.parse(setting.setting) : null;
        const dtoComments = this.transformComments(comments, dtoUser && dtoUser.admin);

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
      if (!request.session.passport.user.administrator) {
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
          request.session.passport.user.id,
          request.body.replyTo,
          request.params.slug)
        .then(lastComment => {
          if (lastComment && lastComment.comment === request.body.comment) {
            response.send({ status: 'rejected', reason: 'reason' });
          } else {
            this.commentService.createComment(
              request.session.passport.user,
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
      if (!request.session.passport.user.administrator) {
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
  private transformComments(comments: Array<Comment>, admin: boolean): Array<DtoComment> {
    return comments.map(comment => {
      const dtoComment = new DtoComment();
      dtoComment.id = comment.id;
      dtoComment.replyTo = comment.replyTo;
      dtoComment.author = comment.user.displayName || comment.user.name;
      dtoComment.authorUrl = this.getAuthorUrl(
        comment.user.url,
        comment.user.provider,
        comment.user.name);
      dtoComment.comment = marked(comment.comment.trim());
      dtoComment.created = this.configurationService.formatDate(comment.created);

      if (admin) {
        dtoComment.approved = comment.status === CommentStatus.APPROVED;
        dtoComment.authorId = comment.user.id;
        dtoComment.authorTrusted = comment.user.status === UserStatus.TRUSTED;
      } else {
        dtoComment.approved = comment.status === CommentStatus.APPROVED || comment.user.status === UserStatus.TRUSTED;
        dtoComment.authorId = null;
        dtoComment.authorTrusted = null;
      }
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
        request.connection.remoteAddress ||
        request.socket.remoteAddress;
    ip = ip.split(',')[0];
    // in case the ip returned in a format: "::ffff:146.xxx.xxx.xxx"
    ip = ip.split(':').pop();
    return ip || 'unknown';
  }
}
