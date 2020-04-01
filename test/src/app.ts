import * as express from 'express';
import * as url from 'url';
import * as proxy from 'express-http-proxy';

// New hostname+path as specified by question:

class App {
  host = 'http://localhost:3000';
  my2CentsProxy = proxy(
    'http://localhost:3000',
    {
      proxyReqPathResolver: (req) => {
        console.log(req.url);
        var parts = req.url.split('?');
        var queryString = parts[1];
        var updatedPath = parts[0].replace(/my2cents/, '');
        var ret = updatedPath + (queryString ? '?' + queryString : '');
        console.log(`forwarding to ${ret}`);
        return ret;
      }
    }
  );

  // public properties
  public app: express.Application;

  public async initialize(): Promise<App> {
    this.app = express();
    this.app.use('/my2cents', this.my2CentsProxy);
    this.app.use(express.static('test/public'));

    return Promise.resolve(this);
  }

  public start(): void {
    const port = 8080;
    this.app.listen(port, () => {
        console.log(new Date() + ` Express server listening on port ${port}`);
      });
  }
}

export default new App();
