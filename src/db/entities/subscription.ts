import { Column, Entity, PrimaryColumn } from 'typeorm';

import { BaseEntity } from './base-entity';

@Entity()
export class Subscription extends BaseEntity {
  @PrimaryColumn('nvarchar', { length: 600, nullable: false })
  public endpoint: string;

  @Column('nvarchar', { length: 4096, nullable: false })
  public publicKey: string;

  @Column('nvarchar', { length: 600, nullable: false })
  public auth: string;
}
