import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseFilterDto } from './dto/course-filter.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user-role.enum';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async list(@Query() filters: CourseFilterDto) {
    return this.coursesService.findAll(filters);
  }

  @Get('search')
  async search(@Query() filters: CourseFilterDto) {
    return this.coursesService.search(filters);
  }

  @Get('my-courses')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async getMyCourses(@CurrentUser() user: User) {
    return this.coursesService.findMyCourses(user);
  }

  @Get(':id(\\d+)')
  async getById(@Param('id') id: number) {
    return this.coursesService.findById(Number(id));
  }

  @Get(':id(\\d+)/stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async getStats(@Param('id') id: number, @CurrentUser() user: User) {
    return this.coursesService.getCourseStats(Number(id), user);
  }

  @Get(':id(\\d+)/outline')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async outline(@Param('id') id: number, @CurrentUser() user: User) {
    return this.coursesService.getOutline(Number(id), user);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async create(@CurrentUser() user: User, @Body() dto: CreateCourseDto) {
    return this.coursesService.create(user, dto);
  }

  @Patch(':id(\\d+)')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async update(@Param('id') id: number, @CurrentUser() user: User, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(Number(id), dto, user);
  }

  @Delete(':id(\\d+)')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async remove(@Param('id') id: number, @CurrentUser() user: User) {
    await this.coursesService.remove(Number(id), user);
    return { success: true };
  }

  @Post(':id(\\d+)/modules')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async createModule(
    @Param('id') id: number,
    @CurrentUser() user: User,
    @Body() dto: CreateModuleDto,
  ) {
    return this.coursesService.createModule(Number(id), dto, user);
  }

  @Patch('modules/:id(\\d+)')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async updateModule(
    @Param('id') id: number,
    @CurrentUser() user: User,
    @Body() dto: UpdateModuleDto,
  ) {
    return this.coursesService.updateModule(Number(id), dto, user);
  }

  @Delete('modules/:id(\\d+)')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async removeModule(@Param('id') id: number, @CurrentUser() user: User) {
    await this.coursesService.removeModule(Number(id), user);
    return { success: true };
  }

  @Post('/modules/:id(\\d+)/lessons')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async createLesson(
    @Param('id') id: number,
    @CurrentUser() user: User,
    @Body() dto: CreateLessonDto,
  ) {
    return this.coursesService.createLesson(Number(id), dto, user);
  }

  @Patch('lessons/:id(\\d+)')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async updateLesson(
    @Param('id') id: number,
    @CurrentUser() user: User,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.coursesService.updateLesson(Number(id), dto, user);
  }

  @Delete('lessons/:id(\\d+)')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async removeLesson(@Param('id') id: number, @CurrentUser() user: User) {
    await this.coursesService.removeLesson(Number(id), user);
    return { success: true };
  }
}
