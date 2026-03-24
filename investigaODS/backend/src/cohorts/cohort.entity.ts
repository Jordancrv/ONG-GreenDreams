import { Check, Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Course } from '../courses/course.entity';
import { Enrollment } from '../enrollments/enrollment.entity';
import { Certificate } from '../certificates/certificate.entity';
import { LiveClass } from '../live-classes/live-class.entity';

@Entity({ name: 'cohorts' })
@Check('chk_cohorts_dates', '`end_at` IS NULL OR `end_at` > `start_at`')
@Check('chk_cohorts_capacity', '`capacity` IS NULL OR `capacity` > 0')
export class Cohort extends BaseEntity {
  @ManyToOne(() => Course, (course) => course.cohorts, { onDelete: 'CASCADE' })
  course!: Course;

  @Column()
  name!: string;

  @Column({ name: 'start_at', type: 'datetime', nullable: true })
  startAt?: Date;

  @Column({ name: 'end_at', type: 'datetime', nullable: true })
  endAt?: Date;

  @Column({ type: 'int', nullable: true })
  capacity?: number;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.cohort)
  enrollments!: Enrollment[];

  @OneToMany(() => Certificate, (certificate) => certificate.cohort)
  certificates!: Certificate[];

  @OneToMany(() => LiveClass, (liveClass) => liveClass.cohort)
  liveClasses!: LiveClass[];
}
