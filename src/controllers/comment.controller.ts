import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import * as domPurify from 'domPurify';
import * as marked from 'marked';
import 'reflect-metadata';
import * as rss from 'rss';

import { CommentApprovedEvent, CommentPostedEvent, CommentRejectedEvent } from '../events';
import { IAuthenticationService, ICommentService, IConfigurationService, IEventService } from '../services';
import { TrfComment, TrfUser } from '../transfer';

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
    @inject(SERVICETYPES.EventService) private eventService: IEventService) {
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

    let trfUser: TrfUser = null;
    if (request.session && request.session.passport && request.session.passport.user) {
      trfUser = new TrfUser();
      trfUser.name = request.session.passport.user.display_name || request.session.passport.user.name;
      trfUser.admin = request.session.passport.user.administrator;
    }

    this.commentService
      .getCommentsBySlug(slug, 1, trfUser && trfUser.admin)
      .then(comments => {
        const trfComments = comments.map(comment => {
          const trfComment = new TrfComment();
          trfComment.id = comment.id;
          trfComment.replyTo = comment.reply_to;
          trfComment.approved = comment.approved;
          trfComment.author = comment.user.display_name || comment.user.name;
          trfComment.authorUrl = this.getAuthorUrl(
            comment.user.url,
            comment.user.provider,
            comment.user.name);
          trfComment.comment = marked(comment.comment.trim());
          trfComment.created = this.configurationService.formatDate(comment.created);
          if (trfUser && trfUser.admin) {
            trfComment.authorId = comment.user.id;
            trfComment.authorTrusted = comment.user.trusted;
          } else {
            trfComment.authorId = null;
            trfComment.authorTrusted = null;
          }
          return trfComment;
        });

        response.send(
          {
            auth: trfUser ?
              null :
              this.authenticationService.getProviders(),
            comments: trfComments,
            slug,
            user: trfUser
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
    response.send({ html: domPurify.sanitize(dirty) });
  }

  public postComment(request: Request, response: Response): void {
    if (!request.isAuthenticated()) {
      response.sendStatus(401);
    } else {
      this.commentService
        .getLastComment(
          request.session.passport.user.id,
          request.body.reply_to,
          request.params.slug)
        .then(lastComment => {
          if (lastComment && lastComment.comment === request.body.comment) {
            response.send({ status: 'rejected', reason: 'reason' });
          } else {
            this.commentService.createComment(
              request.session.passport.user,
              request.body.replyTo === undefined ? null : request.body.reply_to,
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
