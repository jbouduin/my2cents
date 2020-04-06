import * as express from 'express';
import * as proxy from 'express-http-proxy';
import * as url from 'url';

class App {
  // public properties
  public app: express.Application;

  // private properties
  private host = 'http://localhost:3000';

  public async initialize(): Promise<App> {
    this.app = express();
    this.initializeProxy(this.app);
    this.app.use(express.static('public'));

    return Promise.resolve(this);
  }

  public start(): void {
    const port = 8080;
    this.app.listen(port, () => {
        console.info(new Date() + ` Express server listening on port ${port}`);
      });
  }

  private initializeProxy(app: express.Application): void {
    const my2CentsProxy = proxy(
      'http://localhost:3000',
      {
        proxyReqPathResolver: req => {
          console.info(req.url);
          const parts = req.url.split('?');
          const queryString = parts[1];
          const updatedPath = parts[0].replace('/my2cents/', '/');
          const ret = updatedPath + (queryString ? '?' + queryString : '');
          console.info(`forwarding to ${ret}`);
          return ret;
        }
      }
    );
    app.use('/my2cents', my2CentsProxy);
  }
}

export default new App();
