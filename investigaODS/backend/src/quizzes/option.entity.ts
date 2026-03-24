import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Question } from './question.entity';

@Entity({ name: 'options' })
export class Option {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Question, (question) => question.options, { onDelete: 'CASCADE', nullable: false })
  question!: Question;

  @Column({ type: 'text' })
  text!: string;

  @Column({ name: 'is_correct', default: false })
  isCorrect!: boolean;

  @Column({ type: 'text', nullable: true })
  explanation?: string;
}
