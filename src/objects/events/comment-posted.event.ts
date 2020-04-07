import { Comment } from '../../db/entities';
import { Event, EventType } from './event';

export class CommentPostedEvent extends Event<Comment> {

  // constructor
  public constructor(public comment: Comment) {
    super(EventType.COMMENTPOSTED, comment);
  }

}
