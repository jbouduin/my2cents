export enum TargetType {
  COMMENTS = 'comments',
  SESSIONS = 'sessions'
}

export class CfgTarget {
  public connectionName: string;
  public targetType: TargetType;
}
