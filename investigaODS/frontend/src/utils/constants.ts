import type { CourseCardProps, MembershipPlan } from '../types';

// ============================================
// COLORS (Figma Design System)
// ============================================

export const COLORS = {
  primary: '#5dbb46',
  secondary: '#d9d203',
  background: '#062860',
  text: '#ffffff',
  textDark: '#000000',
  overlay: 'rgba(217, 217, 217, 0.5)',
} as const;

// ============================================
// ROUTES
// ============================================

export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  COURSES: '/courses',
  COURSE_DETAIL: (slug: string | number) => `/courses/${slug}`,
  
  // Student routes
  DASHBOARD: '/dashboard',
  DASHBOARD_BASIC: '/dashboard/basic',
  DASHBOARD_PRO: '/dashboard/pro',
  LEARN: (courseId: string | number, lessonId: string | number) => `/learn/${courseId}/${lessonId}`,
  CERTIFICATES: '/certificates',
  MY_ENROLLMENTS: '/my-enrollments',
  
  // Instructor routes
  INSTRUCTOR: '/instructor',
  INSTRUCTOR_DASHBOARD: '/instructor',
  INSTRUCTOR_COURSES: '/instructor/courses',
  INSTRUCTOR_STUDENTS: '/instructor/students',
  INSTRUCTOR_COURSE_CREATE: '/instructor/courses/new',
  INSTRUCTOR_COURSE_BUILDER: (id: string | number) => `/instructor/courses/${id}/builder`,
  INSTRUCTOR_COURSE_STUDENTS: (id: string | number) => `/instructor/courses/${id}/students`,
  
  // Admin routes
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_CATALOG: '/admin/catalog',
  ADMIN_SUBSCRIPTIONS: '/admin/subscriptions',
  
  // Utility
  PLANS: '/plans',
  VERIFY_CERTIFICATE: '/certificates/verify',
} as const;

// ============================================
// MEMBERSHIP PLANS
// ============================================

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'basic-plan',
    code: 'BASIC',
    name: 'Student Basic',
    features: [
      'Acceso a cursos autodidacta (self-paced)',
      'Contenido de video y recursos descargables',
      'Evaluaciones básicas',
      'Comunidad de estudiantes',
    ],
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'pro-plan',
    code: 'PRO',
    name: 'Student Pro',
    features: [
      'Todo lo de Basic, más:',
      'Acceso a cursos guiados con cohortes',
      'Certificados verificables',
      'Clases sincrónicas en vivo',
      'Desafíos con puntaje y gamificación',
      'Evaluaciones avanzadas y proyectos',
      'Soporte prioritario',
      'Comunidad privada',
    ],
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
];

// ============================================
// MOCK DATA (Legacy - para compatibilidad con componentes actuales)
// ============================================

export const MOCK_COURSES_BASIC: CourseCardProps[] = [
  {
    id: '1',
    title: 'Reciclaje Orgánico Avanzado',
    professor: 'Juan Perez',
    progress: 85,
    progressColor: COLORS.primary,
    isPro: false,
  },
  {
    id: '2',
    title: 'Compost agroecológico',
    professor: 'Valeria Paez',
    progress: 45,
    progressColor: COLORS.secondary,
    isPro: false,
  },
];

export const MOCK_COURSES_PRO: CourseCardProps[] = [
  {
    id: '3',
    title: 'Reciclaje con IA',
    professor: 'Ana García',
    progress: 0,
    progressColor: COLORS.primary,
    isPro: true,
  },
  {
    id: '4',
    title: 'Hidrocarburos y su impacto ambiental',
    professor: 'Carlos Ruiz',
    progress: 0,
    progressColor: COLORS.primary,
    isPro: true,
  },
  {
    id: '5',
    title: 'Mediciones acuáticas',
    professor: 'Laura Martínez',
    progress: 0,
    progressColor: COLORS.primary,
    isPro: true,
  },
];
