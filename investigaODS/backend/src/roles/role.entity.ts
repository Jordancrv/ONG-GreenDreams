import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { User } from '../users/user.entity';

@Entity({ name: 'roles' })
export class Role extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @OneToMany(() => User, (user) => user.role)
  users!: User[];
}