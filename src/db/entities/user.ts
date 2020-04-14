import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CreateDateColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

import { BaseEntity } from './base-entity';
import { Comment } from './comment';

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

  @Column({ default: false })
  public administrator: boolean;

  @Index()
  @Column({ default: false })
  public blocked: boolean;

  @Index()
  @Column({ default: false })
  public trusted: boolean;

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
