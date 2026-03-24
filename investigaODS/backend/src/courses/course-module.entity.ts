import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Course } from './course.entity';
import { Lesson } from '../lessons/lesson.entity';

@Entity({ name: 'course_modules' })
@Index('UQ_course_modules_course_position', ['course', 'position'], { unique: true })
export class CourseModule extends BaseEntity {
  @ManyToOne(() => Course, (course) => course.modules, { onDelete: 'CASCADE', nullable: false })
  course!: Course;

  @Column({ name: 'position' })
  position!: number;

  @Column()
  title!: string;

  @Column({ nullable: true })
  summary?: string;

  @OneToMany(() => Lesson, (lesson) => lesson.module)
  lessons!: Lesson[];
}
