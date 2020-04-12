import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

import { BaseEntity } from './base-entity';
import { User } from './user';

// FIXME: (#594) until we find the time to fix this, we have to disable tslint:disable
// I'm not sure anymore why I did not do this from the beginning.
/* tslint:disable variable-name */
@Entity()
export class Comment extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Index()
  @ManyToOne(type => User, user => user.comments, { nullable: false })
  public user: User;

  @Column({ nullable: true })
  public reply_to: number;

  @Column('nvarchar', { length: 256, nullable: false })
  public slug: string;

  @Column('nvarchar', { length: 8192, nullable: false })
  public comment: string;

  @Index()
  @Column({ default: false })
  public rejected: boolean;

  @Index()
  @Column({ default: false })
  public approved: boolean;

  @Column('nvarchar', { length: 256, nullable: false })
  public ip_address: string;

  @Column('nvarchar', { length: 512, nullable: false })
  public user_agent: string;
}
