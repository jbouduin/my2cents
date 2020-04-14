import { inject, injectable } from 'inversify';
import { Repository } from 'typeorm';

import { IConfigurationService, IDatabaseService } from '../../services';

import { Comment, User } from '../entities';
import SERVICETYPES from '../../services/service.types';

import { ISeeder, Seeder } from './seeder';

export interface ICommentSeeder extends ISeeder {

}

@injectable()
export class CommentSeeder extends Seeder implements ICommentSeeder {

  // constructor
  // constructor
  public constructor(
    @inject(SERVICETYPES.ConfigurationService) private configurationService: IConfigurationService,
    @inject(SERVICETYPES.DatabaseService) private databaseService: IDatabaseService) {
    super();
  }

  // interface methods
  public async seed(): Promise<boolean> {
    const commentRepository = this.databaseService.getCommentRepository();
    if (!await this.checkNeedForSeed(commentRepository)) {
      console.info('No need for seeding the comments table');
      return Promise.resolve(false);
    }

    const userRepository = this.databaseService.getUserRepository();
    const data = require('./comment.data').default;
    const allPromises = new Array<Promise<Comment>>();
    data.forEach(element =>
      this
        .seedMultipleComments(
          element.slug,
          null,
          element.comments,
          commentRepository,
          userRepository)
        .forEach(result => allPromises.push(result))
    );

    return Promise.all(allPromises).then(() => Promise.resolve(true));
  }

  // private helper methods
  private async checkNeedForSeed(commentRepository: Repository<Comment>): Promise<boolean> {
    if (this.configurationService.getNodeEnvironment() !== 'development' ||
     !this.configurationService.environment.authentication.allowLocal)
    {
      return Promise.resolve(false);
    }

    return commentRepository
      .createQueryBuilder('comment')
      .getOne()
      .then(comment => !comment);
  }

  private seedMultipleComments(
    slug: string,
    replyTo: number,
    comments: Array<any>,
    commentRepository: Repository<Comment>,
    userRepository: Repository<User>): Array<Promise<Comment>> {
    console.info(`seeding ${slug}${replyTo ? '/' + replyTo : ''} with ${comments.length} ${replyTo ? 'replies' : 'comments'} `);

    return comments.map(comment => this.seedSingleComment(slug, replyTo, comment, commentRepository, userRepository));
  }

  private async seedSingleComment(
    slug: string,
    replyTo: number,
    comment: any,
    commentRepository: Repository<Comment>,
    userRepository: Repository<User>): Promise<Comment> {

    const user = await userRepository.findOne({ name: comment.user.toLowerCase() })
    const content = comment.comment ?
      comment.comment :
      `### ${replyTo ? 'Reply' : 'Comment'} by *${user.displayName}*

**User Trusted:**  ${user.trusted}

**User Blocked:**  ${user.blocked}

**Comment Approved:** ${comment.approved}

**Comment Rejected:** ${comment.rejected}

`;
    const newComment = commentRepository.create({
      approved: comment.approved,
      comment: content,
      ipAddress: this.ipAddress,
      replyTo,
      rejected: comment.rejected,
      slug,
      user,
      userAgent: this.userAgent
    });

    console.info(`${replyTo ? 'Reply' : 'Comment'} by ${user.displayName}`);

    return commentRepository
      .save(newComment)
      .then(saved => {
        if (comment.replies) {
          this.seedMultipleComments(
            slug,
            saved.id,
            comment.replies,
            commentRepository,
            userRepository);
        }
        return saved;
      });
  }
}
