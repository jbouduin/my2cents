import { Connection } from './connection';
import { Target } from './target';

export class Database {
  public connections: Array<Connection>;
  public targets: Array<Target>;
}
