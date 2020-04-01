export enum TargetType {
  COMMENTS = 'comments',
  SESSIONS = 'sessions'
}

export class Target {
  public connectionName: string;
  public targetType: TargetType;
}
