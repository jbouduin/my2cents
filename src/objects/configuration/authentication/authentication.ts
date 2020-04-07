import { CfgProvider } from './provider';

export class CfgAuthentication {
  public allowAnonymous: boolean;
  public allowLocal: boolean;
  public providers: Array<CfgProvider>;

  public constructor() {
    this.allowAnonymous = false;
    this.allowLocal = true;
    this.providers = new Array<CfgProvider>();
  }
}
