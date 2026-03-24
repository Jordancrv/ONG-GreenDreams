import { Check, Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Lesson } from '../lessons/lesson.entity';

@Entity({ name: 'lesson_progress' })
@Index('UQ_lesson_progress_user_lesson', ['user', 'lesson'], { unique: true })
@Check('chk_progress_pct_range', '`progress_pct` >= 0 AND `progress_pct` <= 100')
export class LessonProgress {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { eager: true, nullable: false })
  user!: User;

  @ManyToOne(() => Lesson, (lesson) => lesson.progresses, { eager: true, nullable: false })
  lesson!: Lesson;

  @Column({ default: false })
  completed!: boolean;

  @Column({ name: 'progress_pct', type: 'int', default: 0 })
  progressPct!: number;

  @Column({ name: 'last_viewed_at', type: 'datetime', nullable: true })
  lastViewedAt?: Date;
}
