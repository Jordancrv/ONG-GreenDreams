// ============================================
// USER & AUTH TYPES
// ============================================

export type UserRole = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';

export type PlanCode = 'BASIC' | 'PRO';

export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED';

export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  planCode?: PlanCode;
  tier?: 'FREE' | 'BASIC' | 'PRO';
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subscription {
  id: number;
  user: User;
  plan: MembershipPlan;
  startAt: string;
  endAt?: string;
  status: SubscriptionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  userPlan: PlanCode;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser?: (user: User) => void;
}

// ============================================
// COURSE & CONTENT TYPES
// ============================================

export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type CourseVisibility = 'PUBLIC' | 'PRIVATE';
export type CourseModality = 'SELF_PACED' | 'GUIDED';
export type CourseTier = 'FREE' | 'BASIC' | 'PRO';

export interface Course {
  id: number;
  title: string;
  slug?: string;
  summary?: string;
  description?: string;
  thumbnailUrl?: string;
  level?: string;
  language?: string;
  visibility: CourseVisibility;
  modality: CourseModality;
  tierRequired: CourseTier;
  hasCertificate: boolean;
  supportsLive: boolean;
  supportsChallenges: boolean;
  owner?: User;
  modules?: Module[];
  tags?: Tag[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Module {
  id: number;
  courseId: number;
  index: number;
  title: string;
  summary?: string;
  lessons?: Lesson[];
}

export interface Lesson {
  id: number;
  moduleId: number;
  index: number;
  title: string;
  content?: string; // Markdown/HTML
  videoUrl?: string;
  duration?: number; // Deprecated, use durationMin
  durationMin?: number; // Duration in minutes from backend
  resources?: string;
}

export interface LessonResource {
  type: 'PDF' | 'LINK' | 'VIDEO' | 'FILE';
  title: string;
  url: string;
}

// ============================================
// ENROLLMENT & PROGRESS TYPES
// ============================================

export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'DROPPED';
export interface Enrollment {
  id: number;
  userId: number;
  courseId: number;
  cohortId?: number;
  status: EnrollmentStatus;
  createdAt: string;
  enrolledAt?: string;
  user?: User;
  course?: Course;
} 

export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  progressPct: number; // 0-100
  lastViewedAt: string;
}

export interface CourseProgress {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  progressPct: number;
  lastAccessedAt?: string;
}

// ============================================
// QUIZ & ASSESSMENT TYPES
// ============================================

export type QuizType = 'QUIZ' | 'EXAM';
export type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'OPEN';
export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';

export interface Quiz {
  id: string;
  courseId?: string;
  lessonId?: string;
  title: string;
  type: QuizType;
  passScore: number;
  attemptLimit?: number;
  timeLimitSec?: number;
  weight?: number;
}

export interface Question {
  id: string;
  quizId: string;
  type: QuestionType;
  prompt: string;
  points: number;
  metadata?: Record<string, any>;
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface Attempt {
  id: string;
  quizId: string;
  userId: string;
  startedAt: string;
  submittedAt?: string;
  score: number;
  status: AttemptStatus;
}

export interface Answer {
  id: string;
  attemptId: string;
  questionId: string;
  optionId?: string;
  openText?: string;
  isCorrect?: boolean;
  awardedPoints?: number;
}

// ============================================
// CERTIFICATE TYPES
// ============================================

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  cohortId?: string;
  serial: string;
  pdfUrl: string;
  hashSha256: string;
  issuedAt: string;
  course?: Course;
}

// ============================================
// MEMBERSHIP & SUBSCRIPTION TYPES
// ============================================

export interface MembershipPlan {
  id: string;
  code: PlanCode;
  name: string;
  features: string[];
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

// ============================================
// COHORT & LIVE CLASS TYPES (PRO)
// ============================================

export interface Cohort {
  id: string;
  courseId: string;
  name: string;
  startAt: string;
  endAt: string;
  capacity?: number;
}

export interface LiveClass {
  id: string;
  courseId: string;
  cohortId?: string;
  title: string;
  startAt: string;
  endAt: string;
  meetingUrl: string;
  recordingUrl?: string;
  capacity?: number;
  timezone: string;
}

// ============================================
// CHALLENGE & GAMIFICATION TYPES (PRO)
// ============================================

export type ChallengeStatus = 'PENDING' | 'SUBMITTED' | 'GRADED';

export interface Challenge {
  id: string;
  courseId?: string;
  lessonId?: string;
  title: string;
  description: string;
  points: number;
  rules?: Record<string, any>;
}

export interface ChallengeSubmission {
  id: string;
  userId: string;
  challengeId: string;
  artifactUrl?: string;
  score: number;
  status: ChallengeStatus;
  submittedAt: string;
}

export interface UserPoints {
  userId: string;
  courseId?: string;
  points: number;
}

// ============================================
// UI & DISPLAY TYPES (Legacy - para compatibilidad)
// ============================================

export interface CourseCardProps {
  id: string;
  title: string;
  professor: string;
  progress: number;
  progressColor?: string;
  isPro?: boolean;
}

// ============================================
// TAG TYPES
// ============================================

export interface Tag {
  id: number;
  name: string;
}
