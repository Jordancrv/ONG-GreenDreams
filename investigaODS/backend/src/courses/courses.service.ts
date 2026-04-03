import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course, CourseTier } from './course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { User } from '../users/user.entity';
import { CourseModule } from './course-module.entity';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { Lesson } from '../lessons/lesson.entity';
import { CourseFilterDto } from './dto/course-filter.dto';
import { Tag } from '../tags/tag.entity';
import { MembershipPlanCode } from '../plans/membership-plan.entity';
import { UserRole } from '../users/user-role.enum';
import { Enrollment, EnrollmentStatus } from '../enrollments/enrollment.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
    @InjectRepository(CourseModule)
    private readonly modulesRepository: Repository<CourseModule>,
    @InjectRepository(Lesson)
    private readonly lessonsRepository: Repository<Lesson>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(Enrollment)
    private readonly enrollmentsRepository: Repository<Enrollment>,
  ) {}

  async findAll(filters: CourseFilterDto) {
    const qb = this.coursesRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.tags', 'tag')
      .leftJoinAndSelect('course.owner', 'owner')
      .where('course.visibility = :visibility', { visibility: 'PUBLIC' });

    if (filters.q) {
      qb.andWhere('(course.title LIKE :q OR course.summary LIKE :q)', { q: `%${filters.q}%` });
    }
    if (filters.tag) {
      qb.andWhere('tag.name = :tag', { tag: filters.tag });
    }
    if (filters.modality) {
      qb.andWhere('course.modality = :modality', { modality: filters.modality });
    }
    if (filters.owner) {
      qb.andWhere('owner.email = :owner', { owner: filters.owner });
    }
    if (filters.tier) {
      qb.andWhere('course.tierRequired = :tier', { tier: filters.tier });
    }
    const courses = await qb.getMany();
    return courses.map((course) => this.stripCourseOwner(course));
  }

  async findAllForAdmin() {
    const courses = await this.coursesRepository.find({
      relations: ['owner', 'tags'],
      order: { createdAt: 'DESC' },
    });
    return courses.map((course) => this.stripCourseOwner(course));
  }

  async findMyCourses(user: User) {
    const courses = await this.coursesRepository.find({
      where: { owner: { id: user.id } },
      relations: ['owner', 'tags'],
      order: { createdAt: 'DESC' },
    });
    return courses.map((course) => this.stripCourseOwner(course));
  }

  async create(owner: User, dto: CreateCourseDto) {
    const slug = dto.slug || this.generateSlug(dto.title);
    const course = this.coursesRepository.create({
      ...dto,
      slug,
      owner,
      tags: await this.resolveTags(dto.tags),
    });
    const saved = await this.coursesRepository.save(course);
    return this.stripCourseOwner(saved);
  }

  async findById(id: number) {
    const course = await this.coursesRepository.findOne({
      where: { id },
      relations: ['owner', 'tags'],
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return this.stripCourseOwner(course);
  }

  async update(courseId: number, dto: UpdateCourseDto, user: User) {
    const course = await this.findById(courseId);
    this.assertCanManageCourse(course, user);
    Object.assign(course, dto);
    if (dto.tags) {
      course.tags = await this.resolveTags(dto.tags);
    }
    const saved = await this.coursesRepository.save(course);
    return this.stripCourseOwner(saved);
  }

  async remove(courseId: number, user: User) {
    const course = await this.findById(courseId);
    this.assertCanManageCourse(course, user);
    await this.coursesRepository.remove(course);
  }

  async getOutline(courseId: number, user: User) {
    const course = await this.coursesRepository.findOne({
      where: { id: courseId },
      relations: ['modules', 'modules.lessons', 'owner'],
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    this.assertCanView(course, user);
    if (course.modules) {
      course.modules = course.modules.sort((a, b) => a.position - b.position);
      course.modules.forEach((module) => {
        if (module.lessons) {
          module.lessons = module.lessons.sort((a, b) => a.position - b.position);
        }
      });
    }
    return this.stripCourseOwner(course);
  }

  async getCourseStats(courseId: number, user: User) {
    const course = await this.findById(courseId);
    this.assertCanManageCourse(course, user);

    const totalStudentsResult = await this.enrollmentsRepository
      .createQueryBuilder('enrollment')
      .select('COUNT(*)', 'count')
      .where('enrollment.course_id = :courseId', { courseId })
      .getRawOne<{ count: string }>();

    const activeStudentsResult = await this.enrollmentsRepository
      .createQueryBuilder('enrollment')
      .select('COUNT(*)', 'count')
      .where('enrollment.course_id = :courseId', { courseId })
      .andWhere('enrollment.status = :status', { status: EnrollmentStatus.ACTIVE })
      .getRawOne<{ count: string }>();

    const completedStudentsResult = await this.enrollmentsRepository
      .createQueryBuilder('enrollment')
      .select('COUNT(*)', 'count')
      .where('enrollment.course_id = :courseId', { courseId })
      .andWhere('enrollment.status = :status', { status: EnrollmentStatus.COMPLETED })
      .getRawOne<{ count: string }>();

    const totalModulesResult = await this.modulesRepository
      .createQueryBuilder('module')
      .select('COUNT(*)', 'count')
      .where('module.course_id = :courseId', { courseId })
      .getRawOne<{ count: string }>();

    const totalLessonsResult = await this.lessonsRepository
      .createQueryBuilder('lesson')
      .innerJoin('course_modules', 'module', 'module.id = lesson.module_id')
      .select('COUNT(*)', 'count')
      .where('module.course_id = :courseId', { courseId })
      .getRawOne<{ count: string }>();

    const totalStudents = Number(totalStudentsResult?.count ?? 0);
    const activeStudents = Number(activeStudentsResult?.count ?? 0);
    const completedStudents = Number(completedStudentsResult?.count ?? 0);
    const totalModules = Number(totalModulesResult?.count ?? 0);
    const totalLessons = Number(totalLessonsResult?.count ?? 0);

    return {
      courseId,
      students: {
        total: totalStudents,
        active: activeStudents,
        completed: completedStudents,
      },
      content: {
        modules: totalModules,
        lessons: totalLessons,
      },
      rating: 0, // TODO: Implement rating system
    };
  }

  async createModule(courseId: number, dto: CreateModuleDto, user: User) {
    const course = await this.findById(courseId);
    this.assertCanManageCourse(course, user);
    let position = dto.position ?? dto.index;
    if (position === undefined) {
      const lastModule = await this.modulesRepository.findOne({
        where: { course: { id: courseId } },
        order: { position: 'DESC' },
      });
      position = (lastModule?.position ?? -1) + 1;
    }
    const module = this.modulesRepository.create({
      course,
      ...dto,
      position,
    });
    return this.modulesRepository.save(module);
  }

  async updateModule(moduleId: number, dto: UpdateModuleDto, user: User) {
    const module = await this.modulesRepository.findOne({
      where: { id: moduleId },
      relations: ['course', 'course.owner'],
    });
    if (!module) {
      throw new NotFoundException('Module not found');
    }
    this.assertCanManageCourse(module.course, user);
    const position = dto.position ?? dto.index;
    Object.assign(module, {
      ...dto,
      ...(position !== undefined ? { position } : {}),
    });
    return this.modulesRepository.save(module);
  }

  async removeModule(moduleId: number, user: User) {
    const module = await this.modulesRepository.findOne({
      where: { id: moduleId },
      relations: ['course', 'course.owner'],
    });
    if (!module) {
      throw new NotFoundException('Module not found');
    }
    this.assertCanManageCourse(module.course, user);
    await this.modulesRepository.remove(module);
  }

  async createLesson(moduleId: number, dto: CreateLessonDto, user: User) {
    const module = await this.modulesRepository.findOne({
      where: { id: moduleId },
      relations: ['course', 'course.owner'],
    });
    if (!module) {
      throw new NotFoundException('Module not found');
    }
    this.assertCanManageCourse(module.course, user);
    let position = dto.position ?? dto.index;
    if (position === undefined) {
      const lastLesson = await this.lessonsRepository.findOne({
        where: { module: { id: moduleId } },
        order: { position: 'DESC' },
      });
      position = (lastLesson?.position ?? -1) + 1;
    }
    const lesson = this.lessonsRepository.create({
      module,
      ...dto,
      position,
    });
    return this.lessonsRepository.save(lesson);
  }

  async updateLesson(lessonId: number, dto: UpdateLessonDto, user: User) {
    const lesson = await this.lessonsRepository.findOne({
      where: { id: lessonId },
      relations: ['module', 'module.course', 'module.course.owner'],
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    this.assertCanManageCourse(lesson.module.course, user);
    const position = dto.position ?? dto.index;
    Object.assign(lesson, {
      ...dto,
      ...(position !== undefined ? { position } : {}),
    });
    return this.lessonsRepository.save(lesson);
  }

  async removeLesson(lessonId: number, user: User) {
    const lesson = await this.lessonsRepository.findOne({
      where: { id: lessonId },
      relations: ['module', 'module.course', 'module.course.owner'],
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    this.assertCanManageCourse(lesson.module.course, user);
    await this.lessonsRepository.remove(lesson);
  }

  assertTierAccess(course: Course, subscriptionPlan?: MembershipPlanCode | CourseTier) {
    const tier = course.tierRequired;
    if (tier === CourseTier.FREE) {
      return;
    }
    if (tier === CourseTier.BASIC) {
      if (subscriptionPlan === MembershipPlanCode.BASIC || subscriptionPlan === MembershipPlanCode.PRO) {
        return;
      }
      throw new ForbiddenException('Course requires BASIC plan');
    }
    if (tier === CourseTier.PRO && subscriptionPlan !== MembershipPlanCode.PRO) {
      throw new ForbiddenException('Course requires PRO plan');
    }
  }

  assertCanManageCourse(course: Course, user: User) {
    const roleCode = this.getRoleCode(user);
    if (roleCode === UserRole.ADMIN) {
      return;
    }
    if (roleCode === UserRole.INSTRUCTOR && course.owner.id === user.id) {
      return;
    }
    throw new ForbiddenException('Not allowed to manage this course');
  }

  private assertCanView(course: Course, user: User) {
    if (course.visibility === 'PUBLIC') {
      return;
    }
    this.assertCanManageCourse(course, user);
  }

  private async resolveTags(tagNames?: string[]) {
    if (!tagNames || tagNames.length === 0) {
      return [];
    }
    const tags: Tag[] = [];
    for (const name of tagNames) {
      let tag = await this.tagsRepository.findOne({ where: { name } });
      if (!tag) {
        tag = this.tagsRepository.create({ name });
        tag = await this.tagsRepository.save(tag);
      }
      tags.push(tag);
    }
    return tags;
  }

  private stripCourseOwner(course: Course) {
    if (course?.owner) {
      const { passwordHash, ...owner } = course.owner as any;
      course.owner = owner as User;
    }
    return course;
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 100);
  }

  private getRoleCode(user: User): UserRole | undefined {
    const roleValue = (user as any).role;
    if (typeof roleValue === 'string') {
      return roleValue as UserRole;
    }
    return roleValue?.code ?? (user as any).roleCode;
  }
}
