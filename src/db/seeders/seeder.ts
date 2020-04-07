import { inject, injectable } from 'inversify';

export interface ISeeder {
  seed(): Promise<any>;
}

@injectable()
export abstract class Seeder {

  // protected properties
  protected ipAddress: string = '127.0.0.1';
  protected userAgent: string = 'My2Cents Server / Seeder';

}
