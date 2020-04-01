import { Provider, ProviderName } from './provider';

export class Authentication {
  public allowAnonymous: boolean;
  public providers: Array<Provider>;

  public constructor() {
    this.allowAnonymous = false;
    this.providers = new Array<Provider>();
  }
}
