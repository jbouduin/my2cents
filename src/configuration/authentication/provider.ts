export enum ProviderName {
  TWITTER = 'Twitter',
  GITHUB = 'GitHub',
  GOOGLE = 'Google',
  FACEBOOK = 'Facebook',
  LINKEDIN = 'LinkedIn',
  INSTAGRAM = 'Instagram'
}

export class Provider {
  public name: ProviderName;
  public id: string;
  public secret: string;
}
