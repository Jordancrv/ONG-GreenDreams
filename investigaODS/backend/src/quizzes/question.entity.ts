import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Quiz } from './quiz.entity';
import { Option } from './option.entity';
import { Answer } from '../attempts/answer.entity';

export enum QuestionType {
  MCQ = 'MCQ',
  TRUE_FALSE = 'TRUE_FALSE',
  OPEN = 'OPEN',
}

@Entity({ name: 'questions' })
export class Question extends BaseEntity {
  @ManyToOne(() => Quiz, (quiz) => quiz.questions, { onDelete: 'CASCADE', nullable: false })
  quiz!: Quiz;

  @Column({ type: 'enum', enum: QuestionType, default: QuestionType.MCQ })
  type!: QuestionType;

  @Column({ type: 'text' })
  prompt!: string;

  @Column({ type: 'int', default: 1 })
  points!: number;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown>;

  @OneToMany(() => Option, (option) => option.question, { cascade: true })
  options!: Option[];

  @OneToMany(() => Answer, (answer) => answer.question)
  answers!: Answer[];
}
