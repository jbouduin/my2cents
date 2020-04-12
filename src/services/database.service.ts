import { Application } from 'express';
import { inject, injectable } from 'inversify';
import 'reflect-metadata';
import { createConnection, getConnection, getRepository } from 'typeorm';
import { Connection as TypeOrmConnection } from 'typeorm';
import { Repository } from 'typeorm';

import { Comment, Session, Setting, Subscription, User } from '../db/entities';
import { CfgConnection, ConnectionType, TargetType } from '../objects/configuration';

import { IConfigurationService} from './configuration.service';
import { IService } from './service';

import SERVICETYPES from './service.types';

export interface IDatabaseService extends IService {
  getCommentRepository(): Repository<Comment>;
  getSessionRepository(): Repository<Session>;
  getSettingRepository(): Repository<Setting>;
  getSubscriptionRepository(): Repository<Subscription>;
  getUserRepository(): Repository<User>;
}

@injectable()
export class DatabaseService implements IDatabaseService {

  // constructor
  public constructor(
    @inject(SERVICETYPES.ConfigurationService) private configurationService: IConfigurationService) { }

  // interface members
  public async initialize(app: Application): Promise<any> {

    const x = new Set(this.configurationService.environment.database.targets.map(target => target.connectionName));
    // if both are in the same db, we only need one single connection
    if (x.size === 1) {
      return this.connectByName(x.values().next().value, [Comment, Setting, Session, Subscription, User]);
    } else {
      return Promise.all([
        this.connectByName(
          this.getConnectionNameForTargetType(TargetType.COMMENTS),
          [Comment, Setting, Subscription, User]),
        this.connectByName(
          this.getConnectionNameForTargetType(TargetType.SESSIONS),
          [Session])
      ]);
    }
  }

  public getCommentRepository(): Repository<Comment> {
    return this
      .getConnectionByTargetType(TargetType.COMMENTS)
      .getRepository(Comment);
  }

  public getSettingRepository(): Repository<Setting> {
    return this
      .getConnectionByTargetType(TargetType.COMMENTS)
      .getRepository(Setting);
  }

  public getSessionRepository(): Repository<Session> {
    return this
      .getConnectionByTargetType(TargetType.SESSIONS)
      .getRepository(Session);
  }

  public getSubscriptionRepository(): Repository<Subscription> {
    return this
      .getConnectionByTargetType(TargetType.COMMENTS)
      .getRepository(Subscription);
  }

  public getUserRepository(): Repository<User> {
    return this
      .getConnectionByTargetType(TargetType.COMMENTS)
      .getRepository(User);
  }

  // private methods
  private getConnectionNameForTargetType(targetType: TargetType): string {
    return this.configurationService.environment.database.targets
      .find(target => target.targetType === targetType).connectionName;
  }

  private getConnectionByTargetType(targetType: TargetType): TypeOrmConnection {
    return getConnection(this.getConnectionNameForTargetType(targetType));
  }

  private async connectByName(connectionName: string, entities: Array<any>): Promise<TypeOrmConnection> {
    let toConnect = this.configurationService.environment.database.connections.find(
      connection => connection.connectionName === connectionName
    );
    if (!toConnect) {
      toConnect = this.configurationService.environment.database.connections[0];
    }
    if (!toConnect) {
      throw new Error('could not find a database to connect');
    }
    return this.createConnection(toConnect, entities);
  }

  private async createConnection(connection: CfgConnection, entities: Array<any>): Promise<TypeOrmConnection> {

    switch (connection.connectionType) {
      case ConnectionType.MYSQL: {
        return this.createMySqlConnection(connection, entities);
      }
      case ConnectionType.POSTGRES: {
        return this.createPostgresConnection(connection, entities);
      }
      case ConnectionType.SQLITE: {
        return this.createSqliteConnection(connection, entities);
      }
    }
  }

  private async createSqliteConnection(connection: CfgConnection, entities: Array<any>): Promise<TypeOrmConnection> {
    return createConnection({
        database: connection.databaseName,
        entities,
        name: connection.connectionName,
        synchronize: true,
        type: 'sqlite'
    });
  }

  private async createMySqlConnection(connection: CfgConnection, entities: Array<any>): Promise<TypeOrmConnection> {
    return createConnection({
        database: connection.databaseName,
        entities,
        host: connection.hostName,
        name: connection.connectionName,
        password: connection.password,
        port: connection.port || 3306,
        synchronize: true,
        type: 'mysql',
        username: connection.user
    });
  }

  private async createPostgresConnection(connection: CfgConnection, entities: Array<any>): Promise<TypeOrmConnection> {
    return createConnection({
        database: connection.databaseName,
        entities,
        host: connection.hostName,
        name: connection.connectionName,
        password: connection.password,
        port: connection.port || 5432,
        synchronize: true,
        type: 'postgres',
        username: connection.user
    });
  }
}
