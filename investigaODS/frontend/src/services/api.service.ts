import api from '../utils/api';
import type { User, Course, Enrollment, MembershipPlan, Subscription } from '../types';

// ============================================
// AUTH SERVICE
// ============================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export const authService = {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const response = await api.get('/users/me');
    return response.data;
  },

  /**
   * Refresh access token
   */
  async refresh(): Promise<AuthResponse> {
    const response = await api.post('/auth/refresh');
    return response.data;
  },
};

// ============================================
// COURSES SERVICE
// ============================================

export interface CourseFilters {
  q?: string;
  level?: string;
  language?: string;
  modality?: string;
  tier?: string;
  ownerId?: number;
  tag?: string;
}

export const coursesService = {
  /**
   * Get all courses with optional filters
   */
  async getAll(filters?: CourseFilters): Promise<Course[]> {
    const response = await api.get('/courses', { params: filters });
    return response.data;
  },

  /**
   * Get my courses (instructor only)
   */
  async getMyCourses(): Promise<Course[]> {
    const response = await api.get('/courses/my-courses');
    return response.data;
  },

  /**
   * Get course by ID
   */
  async getById(id: number): Promise<Course> {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  /**
   * Get course statistics (instructor only)
   */
  async getStats(id: number): Promise<any> {
    const response = await api.get(`/courses/${id}/stats`);
    return response.data;
  },

  /**
   * Get course outline (modules and lessons)
   */
  async getOutline(id: number): Promise<Course> {
    const response = await api.get(`/courses/${id}/outline`);
    return response.data;
  },

  /**
   * Create a new course (instructors only)
   */
  async create(data: Partial<Course>): Promise<Course> {
    const response = await api.post('/courses', data);
    return response.data;
  },

  /**
   * Update a course (instructors only)
   */
  async update(id: number, data: Partial<Course>): Promise<Course> {
    const response = await api.patch(`/courses/${id}`, data);
    return response.data;
  },

  /**
   * Delete a course (instructors only)
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/courses/${id}`);
  },

  /**
   * Create a module in a course
   */
  async createModule(courseId: number, data: any): Promise<any> {
    const response = await api.post(`/courses/${courseId}/modules`, data);
    return response.data;
  },

  /**
   * Update a module
   */
  async updateModule(moduleId: number, data: any): Promise<any> {
    const response = await api.patch(`/courses/modules/${moduleId}`, data);
    return response.data;
  },

  /**
   * Delete a module
   */
  async deleteModule(moduleId: number): Promise<void> {
    await api.delete(`/courses/modules/${moduleId}`);
  },

  /**
   * Create a lesson in a module
   */
  async createLesson(moduleId: number, data: any): Promise<any> {
    const response = await api.post(`/courses/modules/${moduleId}/lessons`, data);
    return response.data;
  },

  /**
   * Update a lesson
   */
  async updateLesson(lessonId: number, data: any): Promise<any> {
    const response = await api.patch(`/courses/lessons/${lessonId}`, data);
    return response.data;
  },

  /**
   * Delete a lesson
   */
  async deleteLesson(lessonId: number): Promise<void> {
    await api.delete(`/courses/lessons/${lessonId}`);
  },

  /**
   * Get students enrolled in a course (instructors only)
   */
  async getStudents(courseId: number): Promise<Enrollment[]> {
    const response = await api.get(`/courses/${courseId}/students`);
    return response.data;
  },
};

// ============================================
// ENROLLMENTS SERVICE
// ============================================

export const enrollmentsService = {
  /**
   * Enroll in a course
   */
  async enroll(courseId: number): Promise<Enrollment> {
    const response = await api.post(`/courses/${courseId}/enroll`);
    return response.data;
  },

  /**
   * Get my enrollments
   */
  async getMyEnrollments(): Promise<Enrollment[]> {
    const response = await api.get('/me/enrollments');
    return response.data;
  },
};

// ============================================
// PROGRESS SERVICE
// ============================================

export interface UpdateProgressDto {
  progressPct?: number;
  completed?: boolean;
}

export interface CourseProgressResponse {
  courseId: number;
  totalLessons: number;
  completedLessons: number;
  progressPct: number;
  overallProgress?: number; // Alias for progressPct
  lessons: Array<{
    lessonId: number;
    completed: boolean;
    progressPct: number;
    lastViewedAt?: string;
  }>;
}

export const progressService = {
  /**
   * Get course progress for current user
   */
  async getCourseProgress(courseId: number): Promise<CourseProgressResponse> {
    const response = await api.get(`/progress/me/courses/${courseId}`);
    const data = response.data;
    
    // Transform backend response to match frontend expectations
    return {
      courseId: data.courseId,
      totalLessons: data.totalLessons,
      completedLessons: data.completedLessons,
      progressPct: data.progressPercentage || 0,
      overallProgress: data.progressPercentage || 0,
      lessons: (data.lessonProgress || []).map((lp: any) => ({
        lessonId: lp.lesson?.id || lp.lessonId,
        completed: lp.completed,
        progressPct: lp.progressPct,
        lastViewedAt: lp.lastViewedAt,
      })),
    };
  },

  /**
   * Update lesson progress
   */
  async updateLessonProgress(
    lessonId: number,
    data: UpdateProgressDto
  ): Promise<void> {
    await api.post(`/progress/lessons/${lessonId}/progress`, data);
  },
};

// ============================================
// FAVORITES SERVICE
// ============================================

export const favoritesService = {
  /**
   * Get all favorites for current user
   */
  async getFavorites(): Promise<any[]> {
    const response = await api.get('/favorites');
    return response.data;
  },
  
  /**
   * Add course to favorites
   */
  async addFavorite(courseId: number): Promise<any> {
    const response = await api.post(`/favorites/${courseId}`);
    return response.data;
  },
  
  /**
   * Remove course from favorites
   */
  async removeFavorite(courseId: number): Promise<void> {
    await api.delete(`/favorites/${courseId}`);
  },
  
  /**
   * Check if course is favorited
   */
  async checkFavorite(courseId: number): Promise<boolean> {
    const response = await api.get(`/favorites/${courseId}/check`);
    return response.data.isFavorite;
  },
};

// ============================================
// USERS SERVICE
// ============================================

export const usersService = {
  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.patch('/users/me', data);
    return response.data;
  },
};

// ============================================
// SUBSCRIPTIONS SERVICE
// ============================================

export const subscriptionsService = {
  /**
   * Get user's active subscription
   */
  async getMyActive(): Promise<Subscription | null> {
    try {
      const response = await api.get('/subscriptions/my-active');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },
};

// ============================================
// PLANS SERVICE
// ============================================

export const plansService = {
  /**
   * Get all plans
   */
  async getAll(): Promise<MembershipPlan[]> {
    const response = await api.get('/plans');
    return response.data;
  },

  /**
   * Get my active subscription
   */
  async getMySubscription(): Promise<any> {
    const response = await api.get('/me/subscription');
    return response.data;
  },

  /**
   * Upgrade subscription
   */
  async upgrade(planCode: string): Promise<any> {
    const response = await api.post('/subscriptions/upgrade', { planCode });
    return response.data;
  },
};

// ============================================
// TAGS SERVICE
// ============================================

export interface Tag {
  id: number;
  name: string;
}

export const tagsService = {
  /**
   * Get all tags
   */
  async getAll(): Promise<Tag[]> {
    const response = await api.get('/tags');
    return response.data;
  },
};

// ============================================
// FILES SERVICE
// ============================================

export interface UploadedFileResponse {
  message: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  url: string;
}

export const filesService = {
  /**
   * Upload a file and get its public URL
   */
  async upload(file: File): Promise<UploadedFileResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};

// ============================================
// QUIZZES SERVICE
// ============================================

export interface Quiz {
  id: number;
  lessonId?: number;
  title: string;
  type: 'QUIZ' | 'EXAM';
  passScore: number;
  attemptLimit?: number;
  timeLimitSec?: number;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: number;
  quizId: number;
  type: 'MCQ' | 'TRUE_FALSE' | 'OPEN';
  question: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
}

export const quizzesService = {
  /**
   * Get quiz by ID
   */
  async getById(id: number): Promise<Quiz> {
    const response = await api.get(`/quizzes/${id}`);
    return response.data;
  },
};

// ============================================
// ATTEMPTS SERVICE (Quiz Attempts)
// ============================================

export interface CreateAnswerDto {
  questionId: number;
  answer: string;
}

export interface AttemptResult {
  id: number;
  quizId: number;
  userId: number;
  score: number;
  passed: boolean;
  submittedAt: string;
  answers: Array<{
    questionId: number;
    answer: string;
    isCorrect: boolean;
    points: number;
  }>;
}

export const attemptsService = {
  /**
   * Start a quiz attempt
   */
  async startAttempt(quizId: number): Promise<any> {
    const response = await api.post(`/quizzes/${quizId}/attempts`);
    return response.data;
  },

  /**
   * Add an answer to an attempt
   */
  async addAnswer(attemptId: number, data: CreateAnswerDto): Promise<any> {
    const response = await api.post(`/attempts/${attemptId}/answers`, data);
    return response.data;
  },

  /**
   * Submit an attempt
   */
  async submitAttempt(attemptId: number): Promise<any> {
    const response = await api.post(`/attempts/${attemptId}/submit`);
    return response.data;
  },

  /**
   * Get attempt result
   */
  async getResult(attemptId: number): Promise<AttemptResult> {
    const response = await api.get(`/attempts/${attemptId}/result`);
    return response.data;
  },
};

// ============================================
// CERTIFICATES SERVICE
// ============================================

export interface Certificate {
  id: number;
  userId: number;
  courseId: number;
  serialNumber: string;
  issuedAt: string;
  course?: Course;
}

export const certificatesService = {
  /**
   * Get my certificates
   */
  async getMyCertificates(): Promise<Certificate[]> {
    const response = await api.get('/me/certificates');
    return response.data;
  },

  /**
   * Verify a certificate by serial number
   */
  async verify(serial: string): Promise<Certificate> {
    const response = await api.get('/certificates/verify', { 
      params: { serial } 
    });
    return response.data;
  },
};
