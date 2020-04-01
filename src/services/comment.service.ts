import { Application } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { Brackets, createQueryBuilder } from 'typeorm';

import { Comment, User } from '../db/entities';

import { IDatabaseService } from './database.service';
import { IService } from './service';

import SERVICETYPES from './service.types';

export interface ICommentService extends IService {
  approveComment(commentId: number): Promise<Comment>;
  createComment(user: User, replyTo: number, slug: string, comment: string): Promise<Comment>;
  getCommentsBySlug(slug: string, userId: number, administrator: boolean): Promise<Array<Comment>>;
  getCommentsForModeration(): Promise<Array<Comment>>;
  getLastComment(userId: number, replyTo: number, slug: string): Promise<Comment>;
  rejectComment(commentId: number): Promise<Comment>;
}

@injectable()
export class CommentService implements ICommentService {

  // constructor
  public constructor(
    @inject(SERVICETYPES.DatabaseService) private databaseService: IDatabaseService) { }

  // interface members
  public async approveComment(commentId: number): Promise<Comment> {
    const commentRepository = this.databaseService.getCommentRepository();
    const comment = await commentRepository.findOne(commentId);
    comment.approved = true;
    comment.rejected = false;
    return commentRepository.save(comment);
  }

  public async createComment(user: User, replyTo: number, slug: string, comment: string): Promise<Comment> {
    const commentRepository = this.databaseService.getCommentRepository();
    const newComment = await commentRepository.create(
      {
        comment,
        reply_to: replyTo,
        slug,
        user
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
      // SELECT user_id, user.name, user.display_name, comment.id,
      //     comment.created_at, comment, approved, trusted, provider,
      //     reply_to
      //   FROM comment INNER JOIN user ON (user_id=user.id)
      //   WHERE slug = ? AND NOT user.blocked
      //     AND NOT comment.rejected
      //   ORDER BY comment.created_at DESC
      qryBuilder.andWhere('not user.blocked')
        .andWhere('not comment.rejected');
    } else {
      // SELECT comment.id, user_id, user.name, user.display_name,
      //     user.url user_url, comment.created_at, comment, approved,
      //     trusted, provider, reply_to
      //   FROM comment INNER JOIN user ON (user_id=user.id)
      //   WHERE slug = ? AND ((
      //     NOT user.blocked AND NOT comment.rejected
      //     AND (comment.approved OR user.trusted))
      //     OR user.id = ?)
      //   ORDER BY comment.created_at DESC
      qryBuilder.andWhere(new Brackets(qb0 =>
        qb0.where(
          new Brackets(qb1 =>
            qb1.where('not user.blocked')
              .andWhere('not comment.rejected')
              .andWhere(
                new Brackets(qb2 =>
                  qb2.where('comment.approved')
                    .orWhere('user.trusted'))
              )
            )
          )
          .orWhere('user.id = :userId', { userId })
        )
      );
    }

    return qryBuilder
      .orderBy('comment.created', 'DESC')
      .getMany();
  }

  public async getCommentsForModeration(): Promise<Array<Comment>> {

    const commentRepository = this.databaseService.getCommentRepository();

    // SELECT comment.id, slug, comment.created_at
    //   FROM comment INNER JOIN user ON (user_id=user.id)
    //   WHERE NOT user.blocked AND NOT user.trusted AND
    //    NOT comment.rejected AND NOT comment.approved
    //    ORDER BY comment.created_at DESC LIMIT 20
    return commentRepository.createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .andWhere('not user.blocked')
      .andWhere('not user.trusted')
      .andWhere('not comment.rejected')
      .andWhere('not comment.approved')
      .orderBy('comment.created', 'DESC')
      .limit(20)
      .getMany();
  }

  public async getLastComment(userId: number, replyTo: number, slug: string): Promise<Comment> {
    console.log(userId);
    console.log(replyTo);
    console.log(slug);

    const queryBuilder = this.databaseService.getCommentRepository()
      .createQueryBuilder('comment')
      .where('comment.userId = :userId', { userId })
      .where('comment.slug = :slug', { slug });

    if (replyTo) {
      queryBuilder.where('comment.reply_to = :replyTo', { replyTo});
    }

    return queryBuilder.orderBy('comment.created', 'DESC')
      .getOne();
  }

  public async initialize(app: Application): Promise<any> {
    return Promise.resolve(true);
  }

  public async rejectComment(commentId: number): Promise<Comment> {
    const commentRepository = this.databaseService.getCommentRepository();
    const comment = await commentRepository.findOne(commentId);
    comment.approved = false;
    comment.rejected = true;
    return commentRepository.save(comment);
  }
}
