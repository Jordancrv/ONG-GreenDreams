import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment, EnrollmentStatus } from './enrollment.entity';
import { CoursesService } from '../courses/courses.service';
import { User } from '../users/user.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { MembershipPlanCode } from '../plans/membership-plan.entity';
import { UserRole } from '../users/user-role.enum';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentsRepository: Repository<Enrollment>,
    private readonly coursesService: CoursesService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async enroll(courseId: number, user: User) {
    const course = await this.coursesService.findById(courseId);
    const subscription = await this.subscriptionsService.findActiveSubscription(user.id);
    const planCode = subscription?.plan.code ?? MembershipPlanCode.BASIC;
    this.coursesService.assertTierAccess(course, planCode);
    const existing = await this.enrollmentsRepository.findOne({
      where: { course: { id: courseId }, user: { id: user.id } },
    });
    if (existing) {
      return this.sanitizeEnrollment(existing);
    }
    const enrollment = this.enrollmentsRepository.create({
      course,
      user,
      status: EnrollmentStatus.ACTIVE,
      enrolledAt: new Date(),
    });
    const saved = await this.enrollmentsRepository.save(enrollment);
    return this.sanitizeEnrollment(saved);
  }

  async listForUser(userId: number) {
    const enrollments = await this.enrollmentsRepository.find({ where: { user: { id: userId } } });
    return enrollments.map((enrollment) => this.sanitizeEnrollment(enrollment));
  }

  async listStudents(courseId: number, user: User) {
    const course = await this.coursesService.findById(courseId);
    this.ensureInstructorAccess(course.owner.id, user);
    const enrollments = await this.enrollmentsRepository.find({ where: { course: { id: courseId } } });
    return enrollments.map((enrollment) => this.sanitizeEnrollment(enrollment));
  }

  private ensureInstructorAccess(ownerId: number, user: User) {
    const roleCode = this.getRoleCode(user);
    if (roleCode === UserRole.ADMIN) {
      return;
    }
    if (roleCode === UserRole.INSTRUCTOR && user.id === ownerId) {
      return;
    }
    throw new ForbiddenException('Not allowed');
  }

  async findEnrollment(id: number) {
    const enrollment = await this.enrollmentsRepository.findOne({ where: { id } });
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }
    return this.sanitizeEnrollment(enrollment);
  }

  private sanitizeEnrollment(enrollment: Enrollment) {
    if (enrollment.user) {
      const { passwordHash, ...user } = enrollment.user as any;
      enrollment.user = user;
    }
    if (enrollment.course?.owner) {
      const { passwordHash, ...owner } = enrollment.course.owner as any;
      enrollment.course.owner = owner;
    }
    return enrollment;
  }

  private getRoleCode(user: User): UserRole | undefined {
    const roleValue = (user as any).role;
    if (typeof roleValue === 'string') {
      return roleValue as UserRole;
    }
    return roleValue?.code ?? (user as any).roleCode;
  }
}
