export class CfgServer {

  // public properties
  public hostname: string;
  public pageSuffix: string;
  public pathToMy2Cents: string;
  public my2CentsPort: number;
  public pathToPage: string;
  public port: number;
  public protocol: string;
  public serveStatic: Array<string>;

  // constructor
  public constructor() {
    this.my2CentsPort = 3000;
    this.pathToMy2Cents = '/my2cents';
    this.pathToPage = '/';
    this.protocol = 'https';
  }

}
