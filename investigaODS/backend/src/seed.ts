import 'reflect-metadata';
import { DataSource } from 'typeorm';
import configuration from './config/configuration';
import { SnakeNamingStrategy } from './database/snake-naming.strategy';
import { MembershipPlan, MembershipPlanCode } from './plans/membership-plan.entity';
import { User } from './users/user.entity';
import { UserRole } from './users/user-role.enum';
import { Role } from './roles/role.entity';
import { Subscription, SubscriptionStatus } from './subscriptions/subscription.entity';
import { Course, CourseModality, CourseTier, CourseVisibility } from './courses/course.entity';
import { CourseModule } from './courses/course-module.entity';
import { Lesson } from './lessons/lesson.entity';
import { Quiz, QuizType } from './quizzes/quiz.entity';
import { Question, QuestionType } from './quizzes/question.entity';
import { Option } from './quizzes/option.entity';
import * as bcrypt from 'bcrypt';

type SeedUserInput = {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  planCode: MembershipPlanCode;
};

async function seed() {
  const config = configuration();
  const dataSource = new DataSource({
    type: 'mysql',
    host: config.database.host,
    port: config.database.port,
    username: config.database.username,
    password: config.database.password,
    database: config.database.name,
    namingStrategy: new SnakeNamingStrategy(),
    entities: [`${__dirname}/**/*.entity.{ts,js}`],
  });

  await dataSource.initialize();
  const planRepo = dataSource.getRepository(MembershipPlan);
  const userRepo = dataSource.getRepository(User);
  const roleRepo = dataSource.getRepository(Role);
  const subscriptionRepo = dataSource.getRepository(Subscription);
  const courseRepo = dataSource.getRepository(Course);
  const moduleRepo = dataSource.getRepository(CourseModule);
  const lessonRepo = dataSource.getRepository(Lesson);
  const quizRepo = dataSource.getRepository(Quiz);
  const questionRepo = dataSource.getRepository(Question);
  const optionRepo = dataSource.getRepository(Option);

  for (const plan of [
    { code: MembershipPlanCode.BASIC, name: 'Basic', features: { live: false } },
    { code: MembershipPlanCode.PRO, name: 'Pro', features: { live: true } },
  ]) {
    const existing = await planRepo.findOne({ where: { code: plan.code } });
    if (!existing) {
      await planRepo.save(planRepo.create(plan));
    }
  }

  const plans = {
    BASIC: await planRepo.findOne({ where: { code: MembershipPlanCode.BASIC } }),
    PRO: await planRepo.findOne({ where: { code: MembershipPlanCode.PRO } }),
  };

  const roleSeed = [
    { code: UserRole.STUDENT, name: 'Student' },
    { code: UserRole.INSTRUCTOR, name: 'Instructor' },
    { code: UserRole.ADMIN, name: 'Admin' },
  ];

  for (const roleRow of roleSeed) {
    const existingRole = await roleRepo.findOne({ where: { code: roleRow.code } });
    if (!existingRole) {
      await roleRepo.save(roleRepo.create(roleRow));
    }
  }

  const seedUsers: SeedUserInput[] = [
    {
      email: 'estudiante@test.com',
      password: '123456',
      role: UserRole.STUDENT,
      firstName: 'Ana',
      lastName: 'Garcia',
      planCode: MembershipPlanCode.BASIC,
    },
    {
      email: 'pro@test.com',
      password: '123456',
      role: UserRole.STUDENT,
      firstName: 'Carlos',
      lastName: 'Lopez',
      planCode: MembershipPlanCode.PRO,
    },
    {
      email: 'instructor@test.com',
      password: '123456',
      role: UserRole.INSTRUCTOR,
      firstName: 'Maria',
      lastName: 'Rodriguez',
      planCode: MembershipPlanCode.BASIC,
    },
    {
      email: 'admin@test.com',
      password: '123456',
      role: UserRole.ADMIN,
      firstName: 'Luis',
      lastName: 'Martinez',
      planCode: MembershipPlanCode.BASIC,
    },
  ];

  for (const seedUser of seedUsers) {
    let user = await userRepo.findOne({ where: { email: seedUser.email }, relations: ['role'] });
    const role = await roleRepo.findOne({ where: { code: seedUser.role } });
    if (!role) {
      continue;
    }

    if (!user) {
      user = userRepo.create({
        email: seedUser.email,
        passwordHash: await bcrypt.hash(seedUser.password, 10),
        role,
        firstName: seedUser.firstName,
        lastName: seedUser.lastName,
      });
      user = await userRepo.save(user);
    } else if (user.role?.code !== role.code) {
      user.role = role;
      user = await userRepo.save(user);
    }

    const targetPlan =
      seedUser.planCode === MembershipPlanCode.PRO ? plans.PRO : plans.BASIC;

    if (!targetPlan) {
      continue;
    }

    const activeSubscription = await subscriptionRepo.findOne({
      where: { user: { id: user.id }, status: SubscriptionStatus.ACTIVE },
    });

    if (!activeSubscription) {
      await subscriptionRepo.save(
        subscriptionRepo.create({
          user,
          plan: targetPlan,
          status: SubscriptionStatus.ACTIVE,
          startAt: new Date(),
        }),
      );
      continue;
    }

    if (activeSubscription.plan?.code !== targetPlan.code) {
      activeSubscription.status = SubscriptionStatus.CANCELLED;
      activeSubscription.endAt = new Date();
      await subscriptionRepo.save(activeSubscription);

      await subscriptionRepo.save(
        subscriptionRepo.create({
          user,
          plan: targetPlan,
          status: SubscriptionStatus.ACTIVE,
          startAt: new Date(),
        }),
      );
    }
  }

  const instructor = await userRepo.findOne({ where: { email: 'instructor@test.com' } });

  let course = await courseRepo.findOne({ where: { slug: 'intro-investigaods' } });
  if (!course && instructor) {
    course = courseRepo.create({
      owner: instructor,
      title: 'Intro to InvestigaODS',
      slug: 'intro-investigaods',
      summary: 'Getting started with sustainable investigations.',
      visibility: CourseVisibility.PUBLIC,
      modality: CourseModality.SELF_PACED,
      tierRequired: CourseTier.FREE,
      hasCertificate: true,
    });
    course = await courseRepo.save(course);

    const module = await moduleRepo.save(
      moduleRepo.create({ course, position: 1, title: 'Welcome Module' }),
    );

    const lesson = await lessonRepo.save(
      lessonRepo.create({ module, position: 1, title: 'Welcome Lesson', content: 'Introduction' }),
    );

    const quiz = await quizRepo.save(
      quizRepo.create({ title: 'Getting Started Quiz', lesson, course, type: QuizType.QUIZ }),
    );

    const question = await questionRepo.save(
      questionRepo.create({
        quiz,
        type: QuestionType.MCQ,
        prompt: 'InvestigaODS focuses on which goals?',
        points: 1,
      }),
    );

    await optionRepo.save(
      optionRepo.create({ question, text: 'Sustainable Development Goals', isCorrect: true }),
    );
    await optionRepo.save(
      optionRepo.create({ question, text: 'Random Objectives', isCorrect: false }),
    );
  }

  await dataSource.destroy();
  // eslint-disable-next-line no-console
  console.log('Seed completed');
}

seed().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed', error);
  process.exit(1);
});
