import * as express from 'express';
import { inject, injectable } from 'inversify';
import * as moment from 'moment';
import * as path from 'path';
import 'reflect-metadata';

import { Application, Configuration, Environment, Notification } from '../configuration';
import { IService } from './service';

export interface IConfigurationService extends IService {
  application: Application;
  environment: Environment;

  formatDate(rawDate: any): string;
  getPageUrl(): string;
  getMy2CentsDomain(): string;
  getMy2CentsUrl(): string;
  isValidUrl(value: string);

}

@injectable()
export class ConfigurationService implements IConfigurationService {

  // public properties
  public application: Application;
  public environment: Environment;

  private configuration: Configuration;

  public formatDate(rawDate: any): string {
    const m = moment.utc(rawDate);
    if (this.application.dateFormat && this.application.dateFormat !== '') {
      return m.format(this.application.dateFormat);
    }
    return m.fromNow();
  }

  public getPageUrl(): string {
    const url = `${this.environment.server.protocol}://${this.environment.server.hostname}`;
    const port = this.environment.server.port ? `:${this.environment.server.port}` : '';
    const suffix = this.environment.server.pageSuffix ? `.${this.environment.server.pageSuffix}` : '';
    return `${url}${port}${this.environment.server.pathToPage}%SLUG%${suffix}`;
  }

  public getMy2CentsDomain(): string {
    const my2CentsHostName = this.environment.server.hostname;

    if (my2CentsHostName === 'localhost') {
      return my2CentsHostName;
    }

    try {
      return my2CentsHostName
        .split('.')
        .slice(1)
        .join('.');
    } catch (error) {
      console.error(
        `The my2CentsHostName value "${my2CentsHostName}" doesn't appear to be a valid hostname`
      );
      process.exit(-1);
    }
  }

  public getMy2CentsUrl(): string {
    const host = `${this.environment.server.protocol}://${this.environment.server.hostname}`;
    return this.environment.server.port && this.environment.server.port !== 0 ?
      `${host}:${this.environment.server.port}/${this.environment.server.pathToMy2Cents}` :
      `${host}/${this.environment.server.pathToMy2Cents}`;
  }

  public async initialize(app: express.Application): Promise<any> {
    this.configuration = await Configuration.loadConfiguration();
    this.environment = this.configuration.current;
    this.application = this.configuration.application;

    console.log(this.configuration);
    return Promise.resolve(this.configuration);
  }

  public isValidUrl(value: string) {
    const regexp =  /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
    if (value && value.match(regexp) !== null) {
      return true;
    }  else  {
      return false;
    }
  }
}
