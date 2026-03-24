import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Quiz } from '../quizzes/quiz.entity';
import { User } from '../users/user.entity';
import { Answer } from './answer.entity';

export enum AttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED',
}

@Entity({ name: 'attempts' })
export class Attempt extends BaseEntity {
  @ManyToOne(() => Quiz, (quiz) => quiz.attempts, { eager: true, nullable: false })
  quiz!: Quiz;

  @ManyToOne(() => User, (user) => user.attempts, { eager: true, nullable: false })
  user!: User;

  @Column({ name: 'started_at', type: 'datetime' })
  startedAt!: Date;

  @Column({ name: 'submitted_at', type: 'datetime', nullable: true })
  submittedAt?: Date;

  @Column({ type: 'int', default: 0 })
  score!: number;

  @Column({ type: 'enum', enum: AttemptStatus, default: AttemptStatus.IN_PROGRESS })
  status!: AttemptStatus;

  @OneToMany(() => Answer, (answer) => answer.attempt, { cascade: true })
  answers!: Answer[];
}
