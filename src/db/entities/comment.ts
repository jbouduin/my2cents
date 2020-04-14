import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

import { BaseEntity } from './base-entity';
import { User } from './user';

@Entity()
export class Comment extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Index()
  @ManyToOne(type => User, user => user.comments, { nullable: false })
  public user: User;

  @Column({ nullable: true })
  public replyTo: number;

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
  public ipAddress: string;

  @Column('nvarchar', { length: 512, nullable: false })
  public userAgent: string;
}
