export enum EventType {
  COMMENTAPPROVED = 'comment-approved',
  COMMENTPOSTED = 'comment-posted',
  COMMENTREJECTED = 'comment-rejected',
  UNKNOWN = ''
}

export interface IEvent {
  getEventType(): EventType;
  getData(): any;
}

export class Event<T> implements IEvent {

  protected constructor(private eventType: EventType, private data: T) { }

  public getEventType(): EventType {
    return this.eventType;
  }

  public getData(): T {
    return this.data;
  }
}
