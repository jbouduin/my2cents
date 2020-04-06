import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

import { BaseEntity } from './base-entity';

@Entity()
export class Setting extends BaseEntity {

  @PrimaryColumn('nvarchar', { length: 128, nullable: false })
  public name: string;

  @Column('nvarchar', { length: 4096, nullable: false })
  public setting: string;
}
