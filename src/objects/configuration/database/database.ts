import { CfgConnection } from './connection';
import { CfgTarget } from './target';

export class CfgDatabase {
  public connections: Array<CfgConnection>;
  public targets: Array<CfgTarget>;
}
