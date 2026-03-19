import 'reflect-metadata';
import { DataSource, ObjectLiteral, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import configuration from '../config/configuration';
import { SnakeNamingStrategy } from '../database/snake-naming.strategy';
import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { UserRole } from '../users/user-role.enum';
import { MembershipPlan, MembershipPlanCode } from '../plans/membership-plan.entity';
import { Subscription, SubscriptionStatus } from '../subscriptions/subscription.entity';
import {
  Course,
  CourseModality,
  CourseTier,
  CourseVisibility,
} from '../courses/course.entity';
import { Tag } from '../tags/tag.entity';
import { CourseModule } from '../courses/course-module.entity';
import { Lesson } from '../lessons/lesson.entity';
import { Enrollment, EnrollmentStatus } from '../enrollments/enrollment.entity';
import { LessonProgress } from '../progress/lesson-progress.entity';
import { Quiz, QuizType } from '../quizzes/quiz.entity';
import { Question, QuestionType } from '../quizzes/question.entity';
import { Option } from '../quizzes/option.entity';
import { Attempt, AttemptStatus } from '../attempts/attempt.entity';
import { Answer } from '../attempts/answer.entity';
import { AuditLog } from '../audit/audit-log.entity';

type PerfConfig = {
  runId: string;
  instructors: number;
  students: number;
  courses: number;
  tags: number;
  modulesPerCourse: number;
  lessonsPerModule: number;
  enrollmentsPerStudent: number;
  progressLessonsPerEnrollment: number;
  attemptsPerCourse: number;
  auditLogs: number;
};

function envInt(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (!raw) {
    return defaultValue;
  }
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return defaultValue;
  }
  return parsed;
}

function loadConfig(): PerfConfig {
  const defaultRunId = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  return {
    runId: process.env.PERF_RUN_ID?.trim() || defaultRunId,
    instructors: envInt('PERF_INSTRUCTORS', 25),
    students: envInt('PERF_STUDENTS', 1200),
    courses: envInt('PERF_COURSES', 350),
    tags: envInt('PERF_TAGS', 60),
    modulesPerCourse: envInt('PERF_MODULES_PER_COURSE', 4),
    lessonsPerModule: envInt('PERF_LESSONS_PER_MODULE', 6),
    enrollmentsPerStudent: envInt('PERF_ENROLLMENTS_PER_STUDENT', 8),
    progressLessonsPerEnrollment: envInt('PERF_PROGRESS_LESSONS_PER_ENROLLMENT', 10),
    attemptsPerCourse: envInt('PERF_ATTEMPTS_PER_COURSE', 6),
    auditLogs: envInt('PERF_AUDIT_LOGS', 6000),
  };
}

function randomInt(minInclusive: number, maxExclusive: number): number {
  return Math.floor(Math.random() * (maxExclusive - minInclusive)) + minInclusive;
}

function pickRandomItems<T>(items: T[], count: number): T[] {
  if (count >= items.length) {
    return [...items];
  }
  const copy = [...items];
  const picked: T[] = [];
  for (let i = 0; i < count; i += 1) {
    const idx = randomInt(0, copy.length);
    picked.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return picked;
}

function courseSlug(runId: string, index: number): string {
  return `perf-${runId}-course-${index.toString().padStart(5, '0')}`;
}

async function saveInChunks<T extends ObjectLiteral>(
  repo: Repository<T>,
  entities: T[],
  chunkSize = 200,
): Promise<T[]> {
  const saved: T[] = [];
  for (let i = 0; i < entities.length; i += chunkSize) {
    const chunk = entities.slice(i, i + chunkSize);
    const result = await repo.save(chunk);
    if (Array.isArray(result)) {
      saved.push(...result);
    } else {
      saved.push(result);
    }
  }
  return saved;
}

async function ensureRoles(roleRepo: Repository<Role>): Promise<Record<string, Role>> {
  const roleSeed = [
    { code: UserRole.STUDENT, name: 'Student' },
    { code: UserRole.INSTRUCTOR, name: 'Instructor' },
    { code: UserRole.ADMIN, name: 'Admin' },
  ];

  for (const seed of roleSeed) {
    const exists = await roleRepo.findOne({ where: { code: seed.code } });
    if (!exists) {
      await roleRepo.save(roleRepo.create(seed));
    }
  }

  const roles = await roleRepo.find();
  const byCode: Record<string, Role> = {};
  for (const role of roles) {
    byCode[role.code] = role;
  }
  return byCode;
}

async function ensurePlans(planRepo: Repository<MembershipPlan>): Promise<Record<string, MembershipPlan>> {
  const planSeed = [
    { code: MembershipPlanCode.BASIC, name: 'Basic', features: { live: false }, status: true },
    { code: MembershipPlanCode.PRO, name: 'Pro', features: { live: true }, status: true },
  ];

  for (const seed of planSeed) {
    const exists = await planRepo.findOne({ where: { code: seed.code } });
    if (!exists) {
      await planRepo.save(planRepo.create(seed));
    }
  }

  const plans = await planRepo.find();
  const byCode: Record<string, MembershipPlan> = {};
  for (const plan of plans) {
    byCode[plan.code] = plan;
  }
  return byCode;
}

async function run(): Promise<void> {
  const cfg = loadConfig();
  const config = configuration();

  const dataSource = new DataSource({
    type: 'mysql',
    host: config.database.host,
    port: config.database.port,
    username: config.database.username,
    password: config.database.password,
    database: config.database.name,
    namingStrategy: new SnakeNamingStrategy(),
    entities: [`${__dirname}/../**/*.entity.{ts,js}`],
  });

  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const roleRepo = dataSource.getRepository(Role);
  const planRepo = dataSource.getRepository(MembershipPlan);
  const subscriptionRepo = dataSource.getRepository(Subscription);
  const tagRepo = dataSource.getRepository(Tag);
  const courseRepo = dataSource.getRepository(Course);
  const moduleRepo = dataSource.getRepository(CourseModule);
  const lessonRepo = dataSource.getRepository(Lesson);
  const enrollmentRepo = dataSource.getRepository(Enrollment);
  const progressRepo = dataSource.getRepository(LessonProgress);
  const quizRepo = dataSource.getRepository(Quiz);
  const questionRepo = dataSource.getRepository(Question);
  const optionRepo = dataSource.getRepository(Option);
  const attemptRepo = dataSource.getRepository(Attempt);
  const answerRepo = dataSource.getRepository(Answer);
  const auditRepo = dataSource.getRepository(AuditLog);

  const roles = await ensureRoles(roleRepo);
  const plans = await ensurePlans(planRepo);

  const passwordHash = await bcrypt.hash('12345678', 10);

  const instructorsToCreate: User[] = [];
  for (let i = 1; i <= cfg.instructors; i += 1) {
    instructorsToCreate.push(
      userRepo.create({
        email: `perf.${cfg.runId}.instructor.${i}@test.com`,
        passwordHash,
        firstName: 'Perf',
        lastName: `Instructor ${i}`,
        role: roles[UserRole.INSTRUCTOR],
        status: 'ACTIVE',
      }),
    );
  }

  const studentsToCreate: User[] = [];
  for (let i = 1; i <= cfg.students; i += 1) {
    studentsToCreate.push(
      userRepo.create({
        email: `perf.${cfg.runId}.student.${i}@test.com`,
        passwordHash,
        firstName: 'Perf',
        lastName: `Student ${i}`,
        role: roles[UserRole.STUDENT],
        status: 'ACTIVE',
      }),
    );
  }

  const instructors = await saveInChunks(userRepo, instructorsToCreate, 150);
  const students = await saveInChunks(userRepo, studentsToCreate, 200);

  const subscriptionBatch: Subscription[] = [];
  for (const user of students) {
    const isPro = Math.random() < 0.35;
    subscriptionBatch.push(
      subscriptionRepo.create({
        user,
        plan: isPro ? plans[MembershipPlanCode.PRO] : plans[MembershipPlanCode.BASIC],
        status: SubscriptionStatus.ACTIVE,
        startAt: new Date(),
      }),
    );
  }
  await saveInChunks(subscriptionRepo, subscriptionBatch, 300);

  const tagsToCreate: Tag[] = [];
  for (let i = 1; i <= cfg.tags; i += 1) {
    tagsToCreate.push(tagRepo.create({ name: `perf-${cfg.runId}-tag-${i}` }));
  }
  const tags = await saveInChunks(tagRepo, tagsToCreate, 200);

  const coursesToCreate: Course[] = [];
  for (let i = 1; i <= cfg.courses; i += 1) {
    const owner = instructors[i % instructors.length];
    const tierValues = [CourseTier.FREE, CourseTier.BASIC, CourseTier.PRO];
    const modalityValues = [CourseModality.SELF_PACED, CourseModality.GUIDED];

    coursesToCreate.push(
      courseRepo.create({
        owner,
        title: `Performance Course ${i}`,
        slug: courseSlug(cfg.runId, i),
        summary: `Synthetic course ${i} for performance testing`,
        description: `This is synthetic data for performance validation. Course ${i}`,
        visibility: CourseVisibility.PUBLIC,
        modality: modalityValues[i % modalityValues.length],
        tierRequired: tierValues[i % tierValues.length],
        supportsChallenges: i % 2 === 0,
        supportsLive: i % 3 === 0,
        hasCertificate: i % 4 === 0,
      }),
    );
  }

  const courses = await saveInChunks(courseRepo, coursesToCreate, 120);

  for (const course of courses) {
    const selectedTags = pickRandomItems(tags, randomInt(2, 6));
    course.tags = selectedTags;
  }
  await saveInChunks(courseRepo, courses, 80);

  const lessonsByCourse = new Map<number, Lesson[]>();

  for (const course of courses) {
    const modules: CourseModule[] = [];
    for (let m = 1; m <= cfg.modulesPerCourse; m += 1) {
      modules.push(
        moduleRepo.create({
          course,
          index: m,
          title: `Module ${m} - ${course.slug}`,
          summary: `Synthetic module ${m}`,
        }),
      );
    }

    const savedModules = await moduleRepo.save(modules);
    const lessons: Lesson[] = [];
    for (const module of savedModules) {
      for (let l = 1; l <= cfg.lessonsPerModule; l += 1) {
        lessons.push(
          lessonRepo.create({
            module,
            index: l,
            title: `Lesson ${l} - module ${module.id}`,
            content: `Synthetic lesson content ${l}`,
            durationMin: randomInt(8, 45),
          }),
        );
      }
    }

    const savedLessons = await lessonRepo.save(lessons);
    lessonsByCourse.set(course.id, savedLessons);
  }

  const enrollmentsToCreate: Enrollment[] = [];
  const enrollmentsByStudent = new Map<number, Enrollment[]>();

  for (const student of students) {
    const selectedCourses = pickRandomItems(courses, Math.min(cfg.enrollmentsPerStudent, courses.length));
    const studentEnrollments: Enrollment[] = [];

    for (const course of selectedCourses) {
      const enrollment = enrollmentRepo.create({
        user: student,
        course,
        status: EnrollmentStatus.ACTIVE,
        enrolledAt: new Date(),
      });
      enrollmentsToCreate.push(enrollment);
      studentEnrollments.push(enrollment);
    }

    enrollmentsByStudent.set(student.id, studentEnrollments);
  }

  const savedEnrollments = await saveInChunks(enrollmentRepo, enrollmentsToCreate, 250);

  const progressToCreate: LessonProgress[] = [];
  for (const enrollment of savedEnrollments) {
    const lessonList = lessonsByCourse.get(enrollment.course.id) ?? [];
    const selectedLessons = pickRandomItems(
      lessonList,
      Math.min(cfg.progressLessonsPerEnrollment, lessonList.length),
    );

    for (const lesson of selectedLessons) {
      const pct = randomInt(10, 101);
      progressToCreate.push(
        progressRepo.create({
          user: enrollment.user,
          lesson,
          progressPct: pct,
          completed: pct >= 90,
          lastViewedAt: new Date(),
        }),
      );
    }
  }
  await saveInChunks(progressRepo, progressToCreate, 300);

  const quizzes: Quiz[] = [];
  for (const course of courses) {
    const lessonList = lessonsByCourse.get(course.id) ?? [];
    if (lessonList.length === 0) {
      continue;
    }

    const quiz = quizRepo.create({
      course,
      lesson: lessonList[0],
      title: `Quiz - ${course.slug}`,
      type: QuizType.QUIZ,
      passScore: 60,
      attemptLimit: 3,
    });
    quizzes.push(await quizRepo.save(quiz));
  }

  for (const quiz of quizzes) {
    const questions: Question[] = [];
    for (let q = 1; q <= 3; q += 1) {
      questions.push(
        questionRepo.create({
          quiz,
          type: QuestionType.MCQ,
          prompt: `Question ${q} for quiz ${quiz.id}`,
          points: 1,
        }),
      );
    }

    const savedQuestions = await questionRepo.save(questions);
    for (const question of savedQuestions) {
      const options: Option[] = [];
      for (let o = 1; o <= 4; o += 1) {
        options.push(
          optionRepo.create({
            question,
            text: `Option ${o}`,
            isCorrect: o === 1,
          }),
        );
      }
      await optionRepo.save(options);
    }
  }

  const attemptsToCreate: Attempt[] = [];
  for (const course of courses) {
    const courseQuiz = quizzes.find((q) => q.course?.id === course.id);
    if (!courseQuiz) {
      continue;
    }

    const enrolledInCourse = savedEnrollments.filter((enr) => enr.course.id === course.id);
    const sample = pickRandomItems(enrolledInCourse, Math.min(cfg.attemptsPerCourse, enrolledInCourse.length));

    for (const enr of sample) {
      attemptsToCreate.push(
        attemptRepo.create({
          quiz: courseQuiz,
          user: enr.user,
          startedAt: new Date(),
          status: AttemptStatus.IN_PROGRESS,
          score: 0,
        }),
      );
    }
  }

  const savedAttempts = await saveInChunks(attemptRepo, attemptsToCreate, 250);

  for (const attempt of savedAttempts) {
    const questions = await questionRepo.find({ where: { quiz: { id: attempt.quiz.id } } });
    const answers: Answer[] = [];

    for (const question of questions) {
      const options = await optionRepo.find({ where: { question: { id: question.id } } });
      const selected = options[randomInt(0, options.length)];
      answers.push(
        answerRepo.create({
          attempt,
          question,
          option: selected,
          isCorrect: selected?.isCorrect ?? false,
          awardedPoints: selected?.isCorrect ? question.points : 0,
        }),
      );
    }

    await answerRepo.save(answers);
  }

  const auditActions = [
    'GET /courses',
    'GET /progress/me/courses/:courseId',
    'GET /me/enrollments',
    'POST /attempts/:id/answers',
    'GET /courses/:id/outline',
  ];

  const auditLogs: AuditLog[] = [];
  const auditUsers = [...students.slice(0, 300), ...instructors.slice(0, 20)];

  for (let i = 0; i < cfg.auditLogs; i += 1) {
    const user = auditUsers[randomInt(0, auditUsers.length)];
    const action = auditActions[randomInt(0, auditActions.length)];

    auditLogs.push(
      auditRepo.create({
        user,
        action,
        metadata: {
          synthetic: true,
          runId: cfg.runId,
          traceId: `perf-${i}`,
          at: new Date().toISOString(),
        },
      }),
    );
  }

  await saveInChunks(auditRepo, auditLogs, 500);

  // eslint-disable-next-line no-console
  console.log('Performance seed complete');
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        instructors: instructors.length,
        students: students.length,
        courses: courses.length,
        tags: tags.length,
        enrollments: savedEnrollments.length,
        progressRows: progressToCreate.length,
        quizzes: quizzes.length,
        attempts: savedAttempts.length,
        auditLogs: auditLogs.length,
        runId: cfg.runId,
      },
      null,
      2,
    ),
  );

  await dataSource.destroy();
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Performance seed failed', err);
  process.exit(1);
});
