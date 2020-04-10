import * as fs from 'fs';
import * as glob from 'glob';
import * as _ from 'lodash';
import * as path from 'path';

import { CfgApplication, CfgEnvironment, CfgServer } from './objects/configuration';
import { CfgAuthentication, CfgProvider, ProviderName } from './objects/configuration';
import { CfgConnection, CfgDatabase, CfgTarget, ConnectionType, TargetType } from './objects/configuration';
import { CfgNotification, CfgPushover, CfgSlack, CfgWebpush } from './objects/configuration';
import { CfgMail, CfgSendMail, CfgSmtp, MailProtocol } from './objects/configuration';

/* tslint:disable no-bitwise */
export enum CfgValidation {
  Ok = 0,
  Warning = 1 >> 0, // 0001 -- the bitshift is unnecessary, but done for consistency
  Error = 1 << 1,   // 0010
  Fatal = 1 << 2   // 0100
}

export class Configuration {

  // static methods
  public static async loadConfiguration(): Promise<Configuration> {
    const result = new Configuration();
    const configDirectory = path.join(result.appPath, 'configuration');
    if (!fs.existsSync(configDirectory)) {
      throw new Error('Configuration directory is missing. Can not start the server');
    }
    return result.loadConfigFiles();
  }

  // public properties
  public application: CfgApplication;
  public appPath: string;
  public validationResult: CfgValidation;
  public environment: string;
  public current: CfgEnvironment;
  public launchedAt: Date;

  // public methods
  public validate(): void {
    this.validationResult = this.checkApplication(this.application) | this.checkEnvironment(this.current);
  }

  // constructor
  private constructor() {
    this.appPath = process.cwd();
    if (process.env.NODE_ENV) {
      this.environment = process.env.NODE_ENV.trim().toLowerCase();
      console.info(`Using ${process.env.NODE_ENV} environment`);
    } else {
      console.info('NODE_ENV not set. Presuming development environment.');
      this.environment = 'development';
    }

    this.launchedAt = new Date();
  }

  // private methods to load the configuration
  private async loadConfigFiles(): Promise<Configuration> {
    const pattern = 'configuration/**/*.+(js|json)';
    const root = {};

    const files = glob.sync(pattern);

    files
      .forEach(file =>  {
        const absolutePath = path.resolve(process.cwd(), file);
        delete require.cache[absolutePath];

        const propPath = this.filePathToPath(file, true);
        const mod = this.templateConfiguration(require(absolutePath), '');

        if (propPath.length === 0) {
          _.merge(root, mod);
        } else {
           _.merge(root, _.setWith({}, propPath, mod, Object));
        }
      });

    const current = _.get(root, `configuration.environments.${this.environment}`);
    const result = new CfgEnvironment();
    this.current = _.merge(result, current);

    const app = new CfgApplication();
    this.application = _.merge(app, _.get(root, 'configuration.application'));
    return Promise.resolve(this);
  }

  private filePathToPath(filePath: string, useFileNameAsKey: boolean = true): string {
    const cleanPath = filePath.startsWith('./') ?
      filePath.slice(2) :
      filePath;

    const prop = cleanPath
      .replace(/(\.settings|\.json|\.js)/g, '')
      .toLowerCase()
      .split('/')
      .map(p => _.trimStart(p, '.'))
      .join('.')
      .split('.');

    const result = useFileNameAsKey === true ?
      prop :
      prop.slice(0, -1);

    return prop.join('.');
  }

  private templateConfiguration(obj: object, configPath) {
    const regex = /\$\{[^()]*\}/g;
    const excludeConfigPaths = ['info.scripts'];

    // Allow values which looks like such as an ES6 literal string without parenthesis inside (aka function call).
    // Exclude config with conflicting syntax (e.g. npm scripts).
    return Object.keys(obj).reduce((acc, key) => {

      if ((_.isPlainObject(obj[key]) || _.isArray(obj[key])) && !_.isString(obj[key])) {
        const template = this.templateConfiguration(obj[key], `${configPath}.${key}`);
        if (_.isArray(obj[key])) {
          acc[key] = new Array<any>();
          Object.keys(template).forEach(f => acc[key].push(template[f]));
        } else {
          acc[key] = template;
        }
      } else if (_.isString(obj[key]) &&
        !excludeConfigPaths.includes(configPath.substr(1)) &&
        obj[key].match(regex) !== null) {
        // tslint:disable-next-line no-eval
        acc[key] = eval('`' + obj[key] + '`');
      } else {
        acc[key] = obj[key];
      }
      return acc;
    }, {});
  }

  // private validation methods
  private checkApplication(application: CfgApplication): CfgValidation {
    return this.mandatoryString('application.json', 'secret', CfgValidation.Fatal, application.secret);
  }

  private checkEnvironment(environment: CfgEnvironment): CfgValidation {
    const result =
      this.checkAuthentication(environment.authentication) |
      this.checkDatabase(environment.database) |
      this.checkMail(environment.mail) |
      this.checkNotification(environment.notification) |
      this.checkServer(environment.server);
    return result;
  }

  private checkAuthentication(authentication: CfgAuthentication): CfgValidation {

    const fileName = 'authentication.json';
    let result = CfgValidation.Ok;
    let validAuthorisation = 0;

    if (authentication.allowAnonymous) {
      if (this.environment !== 'development') {
        result = result | this.logByLevel(
          CfgValidation.Warning,
          `${fileName}: allowAnonymous is set to true. Are you sure you want this in a non-development environment?`);
      }
      validAuthorisation++;
    }

    if (authentication.allowLocal) {
      if (this.environment !== 'development') {
        result = result | this.logByLevel(
          CfgValidation.Error,
          `${fileName}: allowLocal is set to true in a non-development environment! This authentication method will not be activated!`);
      } else {
        validAuthorisation++;
      }
    }

    if (authentication.providers) {
      authentication.providers.forEach(provider => {
        const providerResult = this.checkAuthenticationProvider(fileName, provider);
        if (providerResult === CfgValidation.Ok) {
          validAuthorisation++;
        }
        result = result | providerResult;
      });
    }

    if (validAuthorisation === 0) {
      result = result | this.logByLevel(
        CfgValidation.Fatal,
        `${fileName}: no valid authentication method is activated`);
    }

    return result;
  }

  private checkAuthenticationProvider(fileName: string, provider: CfgProvider): CfgValidation {

    let result: CfgValidation;

    switch(provider.name) {
      case ProviderName.TWITTER:
      case ProviderName.GITHUB:
      case ProviderName.GOOGLE:
      case ProviderName.FACEBOOK:
      case ProviderName.LINKEDIN:
      case ProviderName.INSTAGRAM: {
        if (!provider.id && !provider.secret) {
          if (!provider.id) {
            result = this.logByLevel(
              CfgValidation.Error,
              `${fileName}: '${provider.name}.id' is not set. The provider will not be used.`);
          }
          if (!provider.secret) {
            result = this.logByLevel(
              CfgValidation.Error,
              `${fileName}: '${provider.name}.secret' is not set. The provider will not be used.`);
          }
        } else {
          result = this.logByLevel(
            CfgValidation.Warning,
            `${fileName}: Experimental authentication provider: '${provider.name}' has not been tested.`) |
            this.logByLevel(
              CfgValidation.Ok,
              `${fileName}: authentication provider: '${provider.name}' will be used.`);
        }
        break;
      }
      default: {
        result = this.logByLevel(
          CfgValidation.Error,
          `${fileName}: unknown authentication provider found: '${provider.name}'.`);

      }
    }
    return result;
  }

  private checkDatabase(database: CfgDatabase): CfgValidation {
    const fileName = 'database.json';
    let result = CfgValidation.Ok;
    // check if we have the targets and connections
    result = result |
      this.arrayWithEntry(fileName, 'targets', CfgValidation.Fatal, database.targets) |
      this.arrayWithEntry(fileName, 'connections', CfgValidation.Fatal, database.connections);

    if (result === CfgValidation.Ok)
    {
      result = result |
        this.checkSingleTarget(database, fileName, TargetType.COMMENTS) |
        this.checkSingleTarget(database, fileName, TargetType.SESSIONS);

      const target = database.targets
        .filter(f => f.targetType !== TargetType.COMMENTS && f.targetType !== TargetType.SESSIONS);

      if (target.length > 0) {
        target.forEach(t =>
          result = result | this.logByLevel(
            CfgValidation.Warning,
            `${fileName}: found a useless target type: ${t.targetType}`));
      }
    }

    if (database.connections) {
      database.connections
        .forEach(fe => result = result | this.checkSingleConnection(fileName, fe, database.targets));
    }

    return result;
  }

  private checkSingleTarget(database: CfgDatabase, fileName: string, targetType: TargetType): CfgValidation {
    const noTargetFound = `No target for '${targetType}' found.`;
    const multipleTargetsFound = `Duplicate target for '${targetType}' found.`;
    let result: CfgValidation;

    const target = database.targets.filter(f => f.targetType === targetType);
    if (target.length !== 1) {
      result = this.logByLevel(
        CfgValidation.Fatal,
        `${fileName}: ${target.length === 0 ? noTargetFound : multipleTargetsFound}`);
    } else {
      const connection = database.connections.filter(f => f.connectionName === target[0].connectionName);
      const noConnectionFound = `The connection with name ${target[0].connectionName} for target '${targetType}' is not found.`;
      const multipleConnectionsFound = `The connection with name ${target[0].connectionName} for target '${targetType}' is defined more than once.`;
      if (connection.length !== 1) {
        result = this.logByLevel(
          CfgValidation.Fatal,
          `${fileName}: ${connection.length === 0 ? noConnectionFound : multipleConnectionsFound}`);;
      } else {
        result = this.logByLevel(
          CfgValidation.Ok,
           `${fileName}: connection with name ${target[0].connectionName} for target '${targetType}' is defined => OK`)
      }
    }
    return result;
  }

  private checkSingleConnection(fileName: string, connection: CfgConnection, targets: Array<CfgTarget>): CfgValidation {

    let result = CfgValidation.Ok;

    if (!connection.connectionName) {
      result = result | this.logByLevel(
        CfgValidation.Warning,
        `${fileName}: a nameless connection is found`);
    } else if (targets.filter(f => f.connectionName === connection.connectionName).length === 0) {
      result = result | this.logByLevel(
        CfgValidation.Warning,
        `${fileName}: the connection '${connection.connectionName}' is not targetted.`);
    } else {
      switch (connection.connectionType) {
        case ConnectionType.MYSQL:
        case ConnectionType.POSTGRES: {
          result = result | this.logByLevel(
            CfgValidation.Warning,
            `Experimental Database: My2Cents has not been tested with a database of type '${connection.connectionType}'`
          );
          result = result |
            this.mandatoryString(fileName, `connections.connection[${connection.connectionName}].databaseName`, CfgValidation.Fatal, connection.databaseName) |
            this.mandatoryString(fileName, `connections.connection[${connection.connectionName}].hostName`, CfgValidation.Fatal, connection.hostName) |
            this.mandatoryString(fileName, `connections.connection[${connection.connectionName}].user`, CfgValidation.Fatal, connection.user) |
            this.mandatoryString(fileName, `connections.connection[${connection.connectionName}].password`, CfgValidation.Fatal, connection.password) |
            this.mandatoryNumber(fileName, `connections.connection[${connection.connectionName}].port`, CfgValidation.Fatal, connection.port);

          break;
        }
        case ConnectionType.SQLITE: {
          result = result |
            this.mandatoryString(fileName, `connections.connection[${connection.connectionName}].databaseName`, CfgValidation.Fatal, connection.databaseName);
          break;
        }
        default: {
          result = result | this.logByLevel(
            CfgValidation.Fatal,
            `${fileName}: the connection '${connection.connectionName}' is of the unsupported type '${connection.connectionType}'.`);
          break;
        }
      }
    }
    return result;
  }

  private checkMail(mail: CfgMail): CfgValidation {

    const fileName = 'mail.json';
    let result =
      this.mandatoryString(fileName, 'from', CfgValidation.Fatal, mail.from) |
      this.mandatoryString(fileName, 'to', CfgValidation.Fatal, mail.to);

    switch (mail.mailProtocol) {
      case MailProtocol.NOMAIL: {
        // IDEA: (#589) warn if protocol is nomail and smtp/sendmail are defined
        break;
      }
      case MailProtocol.SMTP: {
        result = result | this.checkSmtp(fileName, mail.smtp);
        // IDEA: (#589) warn if protocol is smpt and sendmail is defined
        break;
      }
      case MailProtocol.SENDMAIL: {
        result = result | this.checkSendMail(fileName, mail.sendMail);
        // IDEA: (#589) warn if protocol is sendmail and smtp is defined
        break;
      }
      default: {
        result = result | this.logByLevel(
          CfgValidation.Error,
          `${fileName}: mailProtocol has an invalid value. No mails will be send`);
        break;
      }
    }
    return result;
  }

  private checkSendMail(fileName: string, sendMail: CfgSendMail) {

    const keyPath = 'mail.sendMail.path';
    let result = this.mandatoryString(fileName, keyPath, CfgValidation.Fatal, sendMail.path);

    if (!fs.existsSync(sendMail.path)) {
      result = result | this.logByLevel(
        CfgValidation.Error,
        `${fileName}: ${keyPath} file '${sendMail.path}' does not exist. No mails will be send`);
    }
    // IDEA: (#589) check if the executeable exists and we can execute it

    return result;
  }

  private checkSmtp(fileName: string, smtp: CfgSmtp): CfgValidation {

    const result =
      this.mandatoryString(fileName, 'smtp.password', CfgValidation.Fatal, smtp.password) |
      this.mandatoryNumber(fileName, 'smtp.port', CfgValidation.Fatal, smtp.port) |
      this.mandatoryString(fileName, 'smtp.user', CfgValidation.Fatal, smtp.user) |
      this.mandatoryBoolean(fileName, 'smtp.secure', CfgValidation.Fatal, smtp.secure) |
      this.mandatoryString(fileName, 'smtp.host', CfgValidation.Fatal, smtp.host);
    return result;
  }

  private checkNotification(notification: CfgNotification): CfgValidation {

    const fileName = 'notification.json';

    let result = this.mandatoryNumber(fileName, 'interval', CfgValidation.Fatal, notification.interval);
    if (notification.interval && notification.interval <= 0) {
      result = result | this.logByLevel(
        CfgValidation.Warning,
        `${fileName}: 'interval' is less than or equal to zero. No notifications will be pushed.`);
    }

    let channels = 0;

    if (notification.pushover) {
      const pushoverResult = this.checkPushover(fileName, notification.pushover);
      if (pushoverResult === CfgValidation.Ok) {
        channels++;
      }
      result = result | pushoverResult;
    }

    if (notification.slack) {
      const slackResult = this.checkSlack(fileName, notification.slack);
      if (slackResult === CfgValidation.Ok) {
        channels++;
      }
      result = result | slackResult;
    }

    if (notification.webpush) {
      const webpushResult = this.checkWebpush(fileName, notification.webpush);
      if (webpushResult === CfgValidation.Ok) {
        channels++;
      }
      result = result | webpushResult;
    }

    if (channels === 0) {
      result = result | this.logByLevel(
        CfgValidation.Warning,
        `${fileName}: No valid channels for notifications are defined.`);
    }

    return result;
  }

  private checkPushover(fileName: string, pushover: CfgPushover): CfgValidation {
    const result =
      this.logByLevel(
        CfgValidation.Warning,
        'Experimental usage of Pushover. This has not been tested!'
      ) |
      this.mandatoryString(fileName, 'pushover.appToken', CfgValidation.Error, pushover.appToken) |
      this.mandatoryString(fileName, 'pushover.userKey', CfgValidation.Error, pushover.userKey);
    return result;
  }

  private checkSlack(fileName: string, slack: CfgSlack): CfgValidation {
    const result =
      this.logByLevel(
        CfgValidation.Warning,
        'Experimental usage of Slack. This has not been tested!'
      ) |
      this.isValidUrl(fileName, 'slack.webHookUrl', CfgValidation.Error, slack.webHookUrl);
    return result;
  }

  private checkWebpush(fileName: string, webpush: CfgWebpush): CfgValidation {
    const result =
      this.mandatoryString(fileName, 'webpush.publicKey', CfgValidation.Error, webpush.publicKey) |
      this.mandatoryString(fileName, 'webpush.privateKey', CfgValidation.Error, webpush.privateKey);
    return result;
  }

  private checkServer(server: CfgServer): CfgValidation {
    const fileName = 'server.json';

    const result =
      this.mandatoryString(fileName, 'hostname', CfgValidation.Fatal, server.hostname) |
      this.mandatoryString(fileName, 'pathToMy2Cents', CfgValidation.Fatal, server.pathToMy2Cents) |
      this.mandatoryNumber(fileName, 'my2CentsPort', CfgValidation.Fatal, server.my2CentsPort) |
      this.mandatoryString(fileName, 'pathToPage', CfgValidation.Fatal, server.pathToPage) |
      this.mandatoryString(fileName, 'protocol', CfgValidation.Fatal, server.protocol) |
      this.arrayWithEntry(fileName, 'serveStatic', CfgValidation.Fatal, server.serveStatic);
    return result;
  }

  private mandatoryString(fileName: string, keyPath: string, level: CfgValidation, setting: any): CfgValidation {
    if (!setting) {
      return this.logByLevel(level, `${fileName}: '${keyPath}' is not set.`);
    }
    return this.logByLevel(CfgValidation.Ok, `${fileName}: '${keyPath}' exists. => OK`);
  }

  private mandatoryNumber(fileName: string, keyPath: string, level: CfgValidation, setting: any): CfgValidation {
    if (!setting) {
      return this.logByLevel(level, `${fileName}: '${keyPath}' is not set.`);
    }
    if (!Number(setting) && Number(setting) !== 0)
    {
      return this.logByLevel(level, `${fileName}: '${keyPath}' must be a numeric value. Current value is '${setting}'.`);
    }
    return this.logByLevel(CfgValidation.Ok, `${fileName}: '${keyPath}' exists and is numeric. => OK`);
  }

  private mandatoryBoolean(fileName: string, keyPath: string, level: CfgValidation, setting: any): CfgValidation {
    if (!setting) {
      return this.logByLevel(level, `${fileName}: '${keyPath}' is not set.`);
    }
    if (!Boolean(setting))
    {
      return this.logByLevel(level, `${fileName}: ${keyPath} must be a boolean value. Current value is '${setting}'.`);
    }
    return this.logByLevel(CfgValidation.Ok, `${fileName}: '${keyPath}' exists and is boolean. => OK`);
  }

  private arrayWithEntry(fileName: string, keyPath: string, level: CfgValidation, setting: Array<any>): CfgValidation {
    if (!setting) {
      return this.logByLevel(level, `${fileName}: ${keyPath} is not set.`);
    }
    if (!setting.length) {
      return this.logByLevel(level, `${fileName}: ${keyPath} must at least contain one single entry.`);
    }
    return this.logByLevel(CfgValidation.Ok, `${fileName}: '${keyPath}' exists and has at least one entry. => OK`);
  }

  private isValidUrl(fileName: string, keyPath: string, level: CfgValidation, setting: string): CfgValidation {
    const regexp =  /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
    if (setting && setting.match(regexp) !== null) {
      return this.logByLevel(CfgValidation.Ok, `${fileName}: '${keyPath}' seems to be a valid URL. => OK`);
    }  else  {
      return this.logByLevel(level, `${fileName}: '${keyPath}' doesn't seem to be a valid URL. Current value is '${setting}'.`);
    }
  }

  private logByLevel(level: CfgValidation, message: string): CfgValidation {
    switch (level) {
      case CfgValidation.Ok: {
        console.info('\x1b[32m', 'INFO', message, '\x1b[0m');
        break;
      }
      case CfgValidation.Warning: {
        console.warn('\x1b[33m', 'WARNING', message, '\x1b[0m');
        break;
      }
      case CfgValidation.Error: {
        console.error('\x1b[35m', 'ERROR', message, '\x1b[0m');
        break;
      }
      case CfgValidation.Fatal: {
        console.error('\x1b[31m', 'FATAL', message, '\x1b[0m');
        break;
      }
    }
    return level;
  }
}
