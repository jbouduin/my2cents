
export class Server {

  // public properties
  public hostname: string;
  public port: number;
  public protocol: string;
  public serveStatic: Array<string>;

  // constructor
  public constructor() {
    this.hostname = process.env.MY2CENTS_HOST || process.env.MY2CENTS_HOSTNAME || 'localhost';
    this.port = Number(process.env.MY2CENTS_PORT) || 3000;
    this.protocol = process.env.MY2CENTS_PROTOCOL || 'https';
  }
}
