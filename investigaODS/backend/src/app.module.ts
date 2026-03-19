import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { typeOrmConfigFactory } from './database/typeorm.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PlansModule } from './plans/plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ProgressModule } from './progress/progress.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { AttemptsModule } from './attempts/attempts.module';
import { CertificatesModule } from './certificates/certificates.module';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { ChatModule } from './chat/chat.module';
import { LiveClassesModule } from './live-classes/live-classes.module';
import { ChallengesModule } from './challenges/challenges.module';
import { HealthModule } from './health/health.module';
import { TagsModule } from './tags/tags.module';
import { FavoritesModule } from './favorites/favorites.module';
import { RolesModule } from './roles/roles.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmConfigFactory,
      imports: [ConfigModule],
    }),
    AuditModule,
    AuthModule,
    UsersModule,
    PlansModule,
    SubscriptionsModule,
    CoursesModule,
    EnrollmentsModule,
    ProgressModule,
    QuizzesModule,
    AttemptsModule,
    CertificatesModule,
    AdminModule,
    ChatModule,
    LiveClassesModule,
    ChallengesModule,
    HealthModule,
    TagsModule,
    FavoritesModule,
    RolesModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
