import { Application } from 'express';

export interface IService {
  initialize(app: Application): Promise<any>;
}
