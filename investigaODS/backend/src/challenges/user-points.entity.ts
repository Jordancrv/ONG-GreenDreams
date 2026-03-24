import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Course } from '../courses/course.entity';

@Entity({ name: 'user_points' })
@Index('UQ_user_points_user_course', ['user', 'course'], { unique: true })
export class UserPoints {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { eager: true, nullable: false })
  user!: User;

  @ManyToOne(() => Course, { eager: true, nullable: false })
  course!: Course;

  @Column({ type: 'int', default: 0 })
  points!: number;
}
