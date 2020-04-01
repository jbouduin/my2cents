import { CreateDateColumn, Index, UpdateDateColumn, VersionColumn } from 'typeorm';

export abstract class BaseEntity {

  @Index()
  @CreateDateColumn()
  public created: Date;

  @UpdateDateColumn()
  public modified: Date;

  @VersionColumn()
  public version: number;

}
