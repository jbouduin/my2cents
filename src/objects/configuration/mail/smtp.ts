export class CfgSmtp {

  public host: string;
  public password: string;
  public port: number;
  public secure: boolean;
  public user: string;

  public constructor() {
    this.port = 465;
    this.secure = true;
  }

}
