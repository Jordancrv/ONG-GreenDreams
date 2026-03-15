import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Course } from '../courses/course.entity';
import { Enrollment } from '../enrollments/enrollment.entity';
import { Subscription } from '../subscriptions/subscription.entity';
import { Attempt } from '../attempts/attempt.entity';
import { Certificate } from '../certificates/certificate.entity';
import { UserRole } from './user-role.enum';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @Column({ unique: true })
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ name: 'first_name', nullable: true })
  firstName?: string;

  @Column({ name: 'last_name', nullable: true })
  lastName?: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  role!: UserRole;

  @Column({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt?: Date | null;

  @Column({ default: 'ACTIVE' })
  status!: string;

  @OneToMany(() => Course, (course) => course.owner)
  courses!: Course[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.user)
  enrollments!: Enrollment[];

  @OneToMany(() => Subscription, (subscription) => subscription.user)
  subscriptions!: Subscription[];

  @OneToMany(() => Attempt, (attempt) => attempt.user)
  attempts!: Attempt[];

  @OneToMany(() => Certificate, (certificate) => certificate.user)
  certificates!: Certificate[];
}
