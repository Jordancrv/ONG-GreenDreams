import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Attempt } from './attempt.entity';
import { Question } from '../quizzes/question.entity';
import { Option } from '../quizzes/option.entity';

@Entity({ name: 'answers' })
export class Answer {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Attempt, (attempt) => attempt.answers, { onDelete: 'CASCADE', nullable: false })
  attempt!: Attempt;

  @ManyToOne(() => Question, (question) => question.answers, { eager: true, nullable: false })
  question!: Question;

  @ManyToOne(() => Option, { eager: true, nullable: true })
  option?: Option;

  @Column({ name: 'open_text', type: 'text', nullable: true })
  openText?: string;

  @Column({ name: 'is_correct', nullable: true })
  isCorrect?: boolean;

  @Column({ name: 'awarded_points', type: 'int', nullable: true })
  awardedPoints?: number;
}
