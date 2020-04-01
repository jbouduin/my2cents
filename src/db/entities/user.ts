import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

import { BaseEntity } from './base-entity';
import { Comment } from './comment';

// TODO until we find the time to change this
/* tslint:disable variable-name */
@Entity()
@Index(['provider', 'provider_id'], { unique: true })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column('nvarchar', { length: 128, nullable: false })
  public name: string;

  @Column('nvarchar', { length: 128, nullable: false })
  public display_name: string;

  @Column('nvarchar', { length: 128, nullable: false })
  public provider: string;

  @Column('nvarchar', { length: 128, nullable: false })
  public provider_id: string;

  @Column({ default: false })
  public administrator: boolean;

  @Index()
  @Column({ default: false })
  public blocked: boolean;

  @Index()
  @Column({ default: false })
  public trusted: boolean;

  @Column('nvarchar', { length: 255, nullable: true })
  public url: string;

  @OneToMany(type => Comment, comment => comment.user)
  public comments: Promise<Array<Comment>>;

}
