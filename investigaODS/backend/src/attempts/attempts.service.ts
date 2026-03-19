import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attempt, AttemptStatus } from './attempt.entity';
import { Quiz } from '../quizzes/quiz.entity';
import { User } from '../users/user.entity';
import { Answer } from './answer.entity';
import { Question } from '../quizzes/question.entity';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { Option } from '../quizzes/option.entity';
import { UserRole } from '../users/user-role.enum';

@Injectable()
export class AttemptsService {
  constructor(
    @InjectRepository(Attempt)
    private readonly attemptsRepository: Repository<Attempt>,
    @InjectRepository(Quiz)
    private readonly quizzesRepository: Repository<Quiz>,
    @InjectRepository(Answer)
    private readonly answersRepository: Repository<Answer>,
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
    @InjectRepository(Option)
    private readonly optionsRepository: Repository<Option>,
  ) {}

  async startAttempt(quizId: number, user: User) {
    const quiz = await this.quizzesRepository.findOne({ where: { id: quizId }, relations: ['questions'] });
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    if (quiz.attemptLimit) {
      const count = await this.attemptsRepository.count({
        where: { quiz: { id: quizId }, user: { id: user.id } },
      });
      if (count >= quiz.attemptLimit) {
        throw new ForbiddenException('Attempt limit reached');
      }
    }
    const attempt = this.attemptsRepository.create({
      quiz,
      user,
      startedAt: new Date(),
      status: AttemptStatus.IN_PROGRESS,
    });
    const saved = await this.attemptsRepository.save(attempt);
    return this.sanitizeAttempt(saved);
  }

  async addAnswer(attemptId: number, user: User, dto: CreateAnswerDto) {
    const attempt = await this.getAttempt(attemptId, user);
    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new ForbiddenException('Attempt already submitted');
    }
    const question = await this.questionsRepository.findOne({ where: { id: dto.questionId }, relations: ['quiz'] });
    if (!question || question.quiz.id !== attempt.quiz.id) {
      throw new ForbiddenException('Question not in quiz');
    }
    let answer = await this.answersRepository.findOne({
      where: { attempt: { id: attemptId }, question: { id: dto.questionId } },
    });
    if (!answer) {
      answer = this.answersRepository.create({ attempt, question });
    }
    if (dto.optionId) {
      const option = await this.optionsRepository.findOne({ where: { id: dto.optionId } });
      if (!option) {
        throw new NotFoundException('Option not found');
      }
      answer.option = option;
      answer.isCorrect = option.isCorrect;
      answer.awardedPoints = option.isCorrect ? question.points : 0;
    }
    if (dto.openText !== undefined) {
      answer.openText = dto.openText;
    }
    const saved = await this.answersRepository.save(answer);
    return saved;
  }

  async submitAttempt(attemptId: number, user: User) {
    const attempt = await this.getAttempt(attemptId, user, ['answers', 'answers.question', 'answers.option']);
    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new ForbiddenException('Attempt already submitted');
    }
    let score = 0;
    for (const answer of attempt.answers) {
      if (answer.awardedPoints) {
        score += answer.awardedPoints;
      } else if (answer.option && answer.option.isCorrect) {
        score += answer.question.points;
        answer.isCorrect = true;
        answer.awardedPoints = answer.question.points;
      } else if (answer.isCorrect) {
        score += answer.awardedPoints ?? 0;
      }
    }
    attempt.score = score;
    attempt.status = AttemptStatus.SUBMITTED;
    attempt.submittedAt = new Date();
    await this.attemptsRepository.save(attempt);
    await this.answersRepository.save(attempt.answers);
    return this.sanitizeAttempt(attempt);
  }

  async getResult(attemptId: number, user: User) {
    const attempt = await this.getAttempt(attemptId, user, ['answers', 'answers.question', 'answers.option']);
    return this.sanitizeAttempt(attempt);
  }

  private async getAttempt(id: number, user: User, relations: string[] = []) {
    const attempt = await this.attemptsRepository.findOne({
      where: { id },
      relations: Array.from(new Set(['user', ...relations])),
    });
    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }
    const roleCode = this.getRoleCode(user);
    if (attempt.user.id !== user.id && roleCode !== UserRole.ADMIN) {
      throw new ForbiddenException('Not allowed to access attempt');
    }
    return attempt;
  }

  private sanitizeAttempt(attempt: Attempt) {
    if (attempt.user) {
      const { passwordHash, ...user } = attempt.user as any;
      attempt.user = user;
    }
    return attempt;
  }

  private getRoleCode(user: User): UserRole | undefined {
    const roleValue = (user as any).role;
    if (typeof roleValue === 'string') {
      return roleValue as UserRole;
    }
    return roleValue?.code ?? (user as any).roleCode;
  }
}
