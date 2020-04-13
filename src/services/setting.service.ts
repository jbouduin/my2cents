import { Application } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { Repository } from 'typeorm';

import { Setting } from '../db/entities';
import { NotificationSetting } from '../objects/settings';

import { IDatabaseService } from './database.service';
import { IService } from './service';

import SETTINGKEYS from '../objects/settings/setting.keys';
import SERVICETYPES from './service.types';

export interface ISettingService extends IService {
  getSetting(key: string): Promise<Setting>;
  setSetting(key: string, value: any): Promise<Setting>;
}

@injectable()
export class SettingService implements ISettingService {

  // constructor
  public constructor(
    @inject(SERVICETYPES.DatabaseService) private databaseService: IDatabaseService) { }

  // interface members
  public async initialize(app: Application): Promise<any> {
    return this.seed();
  }

  public async getSetting(key: string): Promise<Setting> {
    return this.findOrCreateSetting(this.databaseService.getSettingRepository(), key);
  }

  public async setSetting(key: string, value: any): Promise<Setting> {
    const repository = this.databaseService.getSettingRepository();
    return this.findSetting(repository, key)
      .then( setting => {
        if (!setting) {
          setting = this.createSetting(repository, key, value);
        } else {
          this.setValue(setting, value);
        }
        return repository.save(setting);
      });
  }

  // private helper methods
  private seed(): Promise<any> {
    const repository = this.databaseService.getSettingRepository();
    const searches = new Array<Promise<number>>();

    searches.push(repository.count({ where: { name: SETTINGKEYS.Push } }));

    return Promise.all(searches)
      .then((counts: Array<number>) => {
        const newSettings = new Array<Setting>();
        if (counts[0] === 0) {
          console.info('creating \'notification\' setting');
          newSettings.push(this.createSetting(repository, SETTINGKEYS.Push));
        } else {
          console.info('found \'Push\' setting');
        }
        if (newSettings.length > 0) {
          repository.save(newSettings);
        }
      });
  }

  private async findOrCreateSetting(repository: Repository<Setting>, key: string): Promise<Setting> {
    return this.findSetting(repository, key)
      .then( setting => {
        if (!setting) {
          setting = this.createSetting(repository, key);
          return repository.save(setting)
        }
        return Promise.resolve(setting);
      } );
  }

  private async findSetting(repository: Repository<Setting>, key: string): Promise<Setting> {
    return repository.findOne(key.toLowerCase());
  }

  private createSetting(repository: Repository<Setting>, key: string, value?: any): Setting {
    let newValue: any;

    switch (key) {
      case SETTINGKEYS.Push: {
        newValue = new NotificationSetting();
        if (value) {
          if (Boolean(value)) {
            newValue.active = true;
          } else {
            newValue.active = false;
          }
        }
        break;
      }
      default: {
        return null;
      }
    }

    return repository.create({
      name: key,
      setting: JSON.stringify(newValue)
    });
  }

  private setValue(setting: Setting, value: any) {
    switch (setting.name) {
      case SETTINGKEYS.Push: {
        const newValue = new NotificationSetting();
        if (value === 'true' || value === 1) {
          newValue.active = true;
        } else {
          newValue.active = false;
        }
        setting.setting = JSON.stringify(newValue);
        break;
      }
      default: {
        return null;
      }
    }
  }
}
