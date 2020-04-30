import { Application } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { Brackets, createQueryBuilder } from 'typeorm';

import { Comment, CommentStatus } from '../db/entities';
import { User, UserStatus } from '../db/entities';
import { ICommentSeeder } from '../db/seeders';

import { IDatabaseService } from './database.service';
import { IService } from './service';

import SEEDERTYPES from '../db/seeders/seeder.types';
import SERVICETYPES from './service.types';

export interface ICommentService extends IService {
  approveComment(commentId: number): Promise<Comment>;
  createComment(
    user: User,
    replyTo: number,
    slug: string,
    comment: string,
    ipAddress: string,
    userAgent: string): Promise<Comment>;
  getCommentsBySlug(slug: string, userId: number, administrator: boolean): Promise<Array<Comment>>;
  getCommentsForModeration(): Promise<Array<Comment>>;
  getLastComment(userId: number, replyTo: number, slug: string): Promise<Comment>;
  rejectComment(commentId: number): Promise<Comment>;
}

@injectable()
export class CommentService implements ICommentService {

  // constructor
  public constructor(
    @inject(SERVICETYPES.DatabaseService) private databaseService: IDatabaseService,
    @inject(SEEDERTYPES.CommentSeeder) private commentSeeder: ICommentSeeder) { }

  // interface members
  public async approveComment(commentId: number): Promise<Comment> {
    const commentRepository = this.databaseService.getCommentRepository();
    const comment = await commentRepository.findOne(commentId);
    comment.status = CommentStatus.APPROVED;
    return commentRepository.save(comment);
  }

  public async createComment(
    user: User,
    replyTo: number,
    slug: string,
    comment: string,
    ipAddress: string,
    userAgent: string): Promise<Comment> {
    const commentRepository = this.databaseService.getCommentRepository();
    const newComment = commentRepository.create(
      {
        comment,
        ipAddress,
        replyTo: replyTo ? replyTo : null,
        slug,
        user,
        userAgent
      }
    );
    return commentRepository.save(newComment);
  }

  public async getCommentsBySlug(slug: string, userId: number, administrator: boolean): Promise<Array<Comment>> {

    const commentRepository = this.databaseService.getCommentRepository();

    const qryBuilder = commentRepository.createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.slug = :slug', { slug });

    if (administrator) {
      //   SELECT  *
      //     FROM  comment INNER JOIN user ON (comment.userId = user.id)
      //    WHERE comment.slug = slug
      //      AND NOT user.status = 'blocked'
      //      AND NOT comment.status = 'rejected'
      // ORDER BY comment.created DESC
      qryBuilder.andWhere('user.status != :status', { status: UserStatus.BLOCKED });
        // .andWhere('comment.status != :status', { status: CommentStatus.REJECTED });
    } else {
      //   SELECT  *
      //     FROM  comment INNER JOIN user ON (comment.userId = user.id)
      //    WHERE comment.slug = slug
      //      AND (user.status != blocked
      //        AND comment.status != 'rejected'
      //        AND (comment.status = 'approved' OR user.status IN ('trusted', 'administrator']))
      //       OR user.id = ?)
      // ORDER BY comment.created DESC
      qryBuilder.andWhere(new Brackets(qb0 =>
        qb0.where(
          new Brackets(qb1 =>
            qb1.where('user.status != :status', { status: UserStatus.BLOCKED })
              .andWhere('comment.status != :status', { status: CommentStatus.REJECTED })
              .andWhere(
                new Brackets(qb2 =>
                  qb2.where('comment.status = :status', { status: CommentStatus.APPROVED })
                    .orWhere('user.status IN (:statuses)', { statuses: [UserStatus.TRUSTED, UserStatus.ADMINISTRATOR] })
                )
              )
            )
          )
          .orWhere('user.id = :userId', { userId })
        )
      );
    }

    qryBuilder.orderBy('comment.created', 'DESC')
    console.debug(qryBuilder.getQuery());
    return qryBuilder.getMany();
  }

  public async getCommentsForModeration(): Promise<Array<Comment>> {

    const commentRepository = this.databaseService.getCommentRepository();

    //   SELECT *
    //     FROM comment INNER JOIN user ON (comment.userId = user.id)
    //    WHERE user.status = 'initial'
    //      NOT comment.status = 'initial'
    // ORDER BY comment.created DESC LIMIT 20
    const qryBuilder = commentRepository.createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .andWhere('user.status = :status', { status: UserStatus.INITIAL })
      .andWhere('comment.status = :status', { status: CommentStatus.INITIAL })
      .orderBy('comment.created', 'DESC')
      .limit(20);
    console.debug(qryBuilder.getQuery());
    return qryBuilder.getMany();
  }

  public async getLastComment(userId: number, replyTo: number, slug: string): Promise<Comment> {

    const queryBuilder = this.databaseService.getCommentRepository()
      .createQueryBuilder('comment')
      .where('comment.userId = :userId', { userId })
      .where('comment.slug = :slug', { slug });

    if (replyTo) {
      queryBuilder.where('comment.replyTo = :replyTo', { replyTo });
    }

    return queryBuilder.orderBy('comment.created', 'DESC')
      .getOne();
  }

  public async initialize(app: Application): Promise<any> {
    console.debug('Initializing CommentService');
    return this.commentSeeder.seed();
  }

  public async rejectComment(commentId: number): Promise<Comment> {
    const commentRepository = this.databaseService.getCommentRepository();
    const comment = await commentRepository.findOne(commentId);
    comment.status = CommentStatus.REJECTED;
    return commentRepository.save(comment);
  }
}
