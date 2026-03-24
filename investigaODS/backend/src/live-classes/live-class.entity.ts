import { Check, Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Course } from '../courses/course.entity';
import { Cohort } from '../cohorts/cohort.entity';

@Entity({ name: 'live_classes' })
@Check('chk_live_classes_dates', '`end_at` > `start_at`')
export class LiveClass extends BaseEntity {
  @ManyToOne(() => Course, (course) => course.liveClasses, { nullable: true })
  course?: Course;

  @ManyToOne(() => Cohort, (cohort) => cohort.liveClasses, { nullable: true })
  cohort?: Cohort;

  @Column()
  title!: string;

  @Column({ name: 'start_at', type: 'datetime' })
  startAt!: Date;

  @Column({ name: 'end_at', type: 'datetime', nullable: false })
  endAt!: Date;

  @Column({ name: 'meeting_url', nullable: true })
  meetingUrl?: string;

  @Column({ name: 'recording_url', nullable: true })
  recordingUrl?: string;

  @Column({ type: 'int', nullable: true })
  capacity?: number;

  @Column({ nullable: true })
  timezone?: string;
}
