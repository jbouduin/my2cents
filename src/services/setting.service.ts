import { Application } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';

import { Setting } from '../db/entities';
import { SettingNotification } from '../objects/settings';

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
    const settingRepository = this.databaseService.getSettingRepository();
    // BUG: (#592) handle record not found, although seeding will always create it
    return settingRepository.findOne(key);
  }

  public async setSetting(key: string, value: any): Promise<Setting> {
    const settingRepository = this.databaseService.getSettingRepository();
    const setting = await settingRepository.findOne(key.toLowerCase());
    // BUG: (#592) handle record not found, although seeding will always create it
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
          console.info('creating \'notification\' setting');
          const newSettingNotification = new SettingNotification();
          newSettingNotification.active = true;
          newSettings.push(repository.create(
            {
              name: SETTINGKEYS.Notification,
              setting: JSON.stringify(newSettingNotification)
            }
          ));
        } else {
          console.info('found \'notification\' setting');
        }

        if (newSettings.length > 0) {
          repository.save(newSettings);
        }
      });
  }
}
