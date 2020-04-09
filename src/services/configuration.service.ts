import * as express from 'express';
import { inject, injectable } from 'inversify';
import * as moment from 'moment';
import * as path from 'path';
import 'reflect-metadata';

import { CfgApplication, CfgEnvironment, CfgNotification } from '../objects/configuration';
import { CfgValidation, Configuration } from '../configuration';

import { IService } from './service';

export interface IConfigurationService extends IService {
  application: CfgApplication;
  environment: CfgEnvironment;

  formatDate(rawDate: any): string;
  getNodeEnvironment(): string;
  getPageUrl(): string;
  getMy2CentsDomain(): string;
  getMy2CentsUrl(): string;
}

@injectable()
export class ConfigurationService implements IConfigurationService {

  // public properties
  public application: CfgApplication;
  public environment: CfgEnvironment;

  private configuration: Configuration;

  public formatDate(rawDate: any): string {
    const m = moment.utc(rawDate);
    if (this.application.dateFormat && this.application.dateFormat !== '') {
      return m.format(this.application.dateFormat);
    }
    return m.fromNow();
  }

  public getNodeEnvironment(): string {
    return this.configuration.environment;
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
    this.configuration.validate();
    this.environment = this.configuration.current;
    this.application = this.configuration.application;

    return Promise.resolve(this.configuration);
  }

}
