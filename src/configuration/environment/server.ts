
export class Server {

  // public properties
  public hostname: string;
  public pathToMy2Cents: string;
  public my2CentsPort: number;
  public pathToPage: string;
  public port: number;
  public protocol: string;
  public serveStatic: Array<string>;

  // constructor
  public constructor() {
    this.hostname = process.env.MY2CENTS_HOST || process.env.MY2CENTS_HOSTNAME || 'localhost';
    this.my2CentsPort = Number(process.env.MY2CENTS_PORT) || 3000;
    this.pathToMy2Cents = '/my2cents';
    this.pathToPage = process.env.PATH_TO_PAGE || '/';
    this.port = Number(process.env.PORT) || 0;
    this.protocol = process.env.CLIENT_PROTOCOL || 'https';
  }

}
