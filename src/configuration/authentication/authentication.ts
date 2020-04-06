import { Provider, ProviderName } from './provider';

export class Authentication {
  public allowAnonymous: boolean;
  public allowLocal: boolean;
  public providers: Array<Provider>;

  public constructor() {
    this.allowAnonymous = false;
    this.allowLocal = true;
    this.providers = new Array<Provider>();
  }
}
