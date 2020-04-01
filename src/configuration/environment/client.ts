export class Client {

  // public properties
  public hostname: string;
  public pathToPage: string;
  public port: number;
  public protocol: string;

  // constructor
  public constructor() {
    this.hostname = process.env.CLIENT_HOST || process.env.CLIENT_HOSTNAME || 'localhost';
    this.pathToPage = process.env.CLIENT_PATH_TO_PAGE || '/';
    this.port = Number(process.env.CLIENT_PORT) || 3000;
    this.protocol = process.env.CLIENT_PROTOCOL || 'https';
  }
}
