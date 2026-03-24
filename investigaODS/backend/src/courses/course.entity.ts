import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { User } from '../users/user.entity';
import { CourseModule } from '../courses/course-module.entity';
import { Cohort } from '../cohorts/cohort.entity';
import { Enrollment } from '../enrollments/enrollment.entity';
import { Tag } from '../tags/tag.entity';
import { Certificate } from '../certificates/certificate.entity';
import { LiveClass } from '../live-classes/live-class.entity';
import { Challenge } from '../challenges/challenge.entity';

export enum CourseVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export enum CourseModality {
  SELF_PACED = 'SELF_PACED',
  GUIDED = 'GUIDED',
}

export enum CourseTier {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
}

@Entity({ name: 'courses' })
export class Course extends BaseEntity {
  @ManyToOne(() => User, (user) => user.courses, { eager: true, nullable: false })
  owner!: User;

  @Column()
  title!: string;

  @Column({ unique: true, nullable: false })
  slug!: string;

  @Column({ nullable: true })
  summary?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'thumbnail_url', nullable: true })
  thumbnailUrl?: string;

  @Column({ nullable: true })
  level?: string;

  @Column({ nullable: true })
  language?: string;

  @Column({ type: 'enum', enum: CourseVisibility, default: CourseVisibility.PUBLIC })
  visibility!: CourseVisibility;

  @Column({ type: 'enum', enum: CourseModality, default: CourseModality.SELF_PACED })
  modality!: CourseModality;

  @Column({ type: 'enum', enum: CourseTier, default: CourseTier.FREE })
  tierRequired!: CourseTier;

  @Column({ default: false })
  hasCertificate!: boolean;

  @Column({ default: false })
  supportsLive!: boolean;

  @Column({ default: false })
  supportsChallenges!: boolean;

  @OneToMany(() => CourseModule, (module) => module.course, { cascade: true })
  modules!: CourseModule[];

  @OneToMany(() => Cohort, (cohort) => cohort.course)
  cohorts!: Cohort[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.course)
  enrollments!: Enrollment[];

  @ManyToMany(() => Tag, (tag) => tag.courses, { cascade: true })
  @JoinTable({ name: 'course_tags' })
  tags!: Tag[];

  @OneToMany(() => Certificate, (certificate) => certificate.course)
  certificates!: Certificate[];

  @OneToMany(() => LiveClass, (liveClass) => liveClass.course)
  liveClasses!: LiveClass[];

  @OneToMany(() => Challenge, (challenge) => challenge.course)
  challenges!: Challenge[];
}
