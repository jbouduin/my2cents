import { Application } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';

import { Setting } from '../db/entities';

import { IDatabaseService } from './database.service';
import { IService } from './service';

import { SettingNotification } from './settings';

import SERVICETYPES from './service.types';
import SETTINGKEYS from './settings/setting.keys';

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
    const settingRepository = this.databaseService.getSettingRepository();
    return settingRepository.findOne(key);
  }

  public async setSetting(key: string, value: any): Promise<Setting> {
    const settingRepository = this.databaseService.getSettingRepository();
    const setting = await settingRepository.findOne(key.toLowerCase());
    // TODO handle record not found
    const newSettingNotification = new SettingNotification();
    if (value === 'true') {
      newSettingNotification.active = true;
    } else {
      newSettingNotification.active = false;
    }
    setting.setting = JSON.stringify(newSettingNotification);
    return settingRepository.save(setting);
  }

  // private helper methods
  private seed(): Promise<any> {
    const repository = this.databaseService.getSettingRepository();
    const searches = new Array<Promise<number>>();

    searches.push(repository.count({ where: { name: SETTINGKEYS.Notification } }));

    return Promise.all(searches)
      .then((counts: Array<number>) => {
        const newSettings = new Array<Setting>();
        if (counts[0] === 0) {
          console.log('creating \'notification\' setting');
          const newSettingNotification = new SettingNotification();
          newSettingNotification.active = true;
          newSettings.push(repository.create(
            {
              name: SETTINGKEYS.Notification,
              setting: JSON.stringify(newSettingNotification)
            }
          ));
        } else {
          console.log('found \'notification\' setting');
        }

        if (newSettings.length > 0) {
          repository.save(newSettings);
        }
      });
  }
}
