import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

import { BaseEntity } from './base-entity';
import { Comment } from './comment';

export enum UserStatus {
  INITIAL = 'initial',
  TRUSTED = 'trusted',
  BLOCKED = 'blocked',
  ADMINISTRATOR = 'administrator'
}

@Entity()
@Index(['provider', 'providerId'], { unique: true })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column('nvarchar', { length: 128, nullable: false })
  public name: string;

  @Column('nvarchar', { length: 128, nullable: false })
  public displayName: string;

  @Column('nvarchar', { length: 128, nullable: false })
  public provider: string;

  @Column('nvarchar', { length: 128, nullable: false })
  public providerId: string;

  @Index()
  @Column('nvarchar', { length: 32, nullable: false })
  public status: string;

  @Column('nvarchar', { length: 256, nullable: true })
  public url: string;

  @Column('nvarchar', { length: 256, nullable: true })
  public localPassword: string;

  @OneToMany(type => Comment, comment => comment.user)
  public comments: Promise<Array<Comment>>;

  @Column('nvarchar', { length: 256, nullable: false })
  public ipAddress: string;

  @Column('nvarchar', { length: 512, nullable: false })
  public userAgent: string;
}
