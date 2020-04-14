export class DtoComment {
  // the id
  public id: number;
  // the properties to be displayed
  public comment: string;
  public created: string;
  public author: string;
  public authorUrl: string;

  // the properties that are not displayed
  // comment.replyTo: always set
  public replyTo: number;
  // user.id: only set if administrator
  public authorId: number;
  // user.status: only set if administrator or own comment
  public authorStatus: string;
  // user.status in ('trusted', 'administrator') or commend.status = 'approved'
  public canReply: boolean;
  // user.id = comment.user.id
  public own: boolean;
  // comment.status: only set if administrator or when own comment
  public status: string
}
