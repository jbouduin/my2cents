export enum ConnectionType {
  MYSQL = 'mysql',
  POSTGRES = 'postgres',
  SQLITE = 'sqlite'
}
export class Connection {
  public connectionName: string;
  public databaseName: string;
  public connectionType: string;
  public hostName: string;
  public port: number;
  public user: string;
  public password: string;
}
