import { Comment } from '../db/entities';
import { Event, EventType } from './event';

export class CommentApprovedEvent extends Event<Comment> {

  // constructor
  public constructor(public comment: Comment) {
    super(EventType.COMMENTAPPROVED, comment);
  }

}
