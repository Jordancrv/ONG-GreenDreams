import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useCourseOutline } from '../hooks/useCourses';
import { useEnrollments } from '../hooks/useEnrollments';
import { AppHeader } from '../components/AppHeader';
import { BottomNavigation } from '../components/mobile';
import { HelpButton } from '../components/HelpButton';
import { COLORS, ROUTES } from '../utils/constants';
import type { CourseTier } from '../types';

// Mock data - debe venir de API
const MOCK_COURSE_DETAILS = {
  'reciclaje-organico-avanzado': {
    id: '1',
    title: 'Reciclaje Orgánico Avanzado',
    slug: 'reciclaje-organico-avanzado',
    summary: 'Aprende técnicas avanzadas de reciclaje orgánico y compostaje.',
    description: 'En este curso aprenderás las mejores prácticas para el reciclaje orgánico, desde la separación de residuos hasta la creación de compost de alta calidad. Ideal para principiantes que quieren contribuir al medio ambiente.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800',
    level: 'BEGINNER' as const,
    tierRequired: 'FREE' as CourseTier,
    instructor: 'Juan Pérez',
    duration: '4 semanas',
    students: 1250,
    modules: [
      {
        id: 'm1',
        title: 'Introducción al Reciclaje Orgánico',
        lessons: [
          { id: 'l1', title: '¿Qué es el reciclaje orgánico?', duration: 15 },
          { id: 'l2', title: 'Beneficios para el medio ambiente', duration: 20 },
          { id: 'l3', title: 'Materiales reciclables', duration: 25 },
        ],
      },
      {
        id: 'm2',
        title: 'Técnicas de Compostaje',
        lessons: [
          { id: 'l4', title: 'Tipos de compost', duration: 30 },
          { id: 'l5', title: 'Creación de una compostera casera', duration: 40 },
          { id: 'l6', title: 'Mantenimiento y cuidado', duration: 35 },
        ],
      },
      {
        id: 'm3',
        title: 'Proyecto Final',
        lessons: [
          { id: 'l7', title: 'Diseña tu plan de reciclaje', duration: 60 },
          { id: 'l8', title: 'Evaluación final', duration: 45 },
        ],
      },
    ],
  },
  'gestion-residuos-industriales': {
    id: '3',
    title: 'Gestión de Residuos Industriales',
    slug: 'gestion-residuos-industriales',
    summary: 'Estrategias profesionales para gestión de residuos en industrias.',
    description: 'Curso avanzado para profesionales que buscan especializarse en la gestión de residuos industriales. Incluye normativas, certificaciones y casos de estudio reales.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800',
    level: 'ADVANCED' as const,
    tierRequired: 'PRO' as CourseTier,
    instructor: 'Dr. Carlos Méndez',
    duration: '8 semanas',
    students: 420,
    modules: [
      {
        id: 'm1',
        title: 'Normativas Internacionales',
        lessons: [
          { id: 'l1', title: 'ISO 14001 y certificaciones', duration: 45 },
          { id: 'l2', title: 'Legislación ambiental', duration: 50 },
        ],
      },
      {
        id: 'm2',
        title: 'Gestión Práctica',
        lessons: [
          { id: 'l3', title: 'Auditorías ambientales', duration: 60 },
          { id: 'l4', title: 'Casos de estudio', duration: 90 },
        ],
      },
    ],
  },
};

export const CourseDetail: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated, user } = useAuth();
  const { isMobile } = useBreakpoint();
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Extract ID directly from URL parameter (it's just the numeric ID)
  const courseId = slug ? parseInt(slug, 10) : null;
  
  // Validate courseId
  const isValidId = courseId !== null && !isNaN(courseId) && courseId > 0;
  
  const { course, isLoading: isLoadingCourse } = useCourseOutline(isValidId ? courseId : null);
  const { enrollments, isLoading: isLoadingEnrollments, enroll } = useEnrollments();

  const userRole = user?.role === 'INSTRUCTOR' ? 'INSTRUCTOR' : 
                   user?.role === 'ADMIN' ? 'ADMIN' :
                   user?.planCode === 'PRO' ? 'STUDENT_PRO' : 'STUDENT_FREE';

  // Check if user is enrolled
  const isEnrolled = isValidId && enrollments.some(e => e.course?.id === courseId);

  // Loading state
  if (isLoadingCourse || (isAuthenticated && isLoadingEnrollments)) {
    return (
      <div style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: COLORS.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          Cargando curso...
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: COLORS.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '48px', color: 'white', marginBottom: '20px' }}>
            Curso no encontrado
          </h1>
          <button
            onClick={() => navigate(ROUTES.COURSES)}
            style={{
              padding: '12px 30px',
              backgroundColor: COLORS.primary,
              color: COLORS.textDark,
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Ver todos los cursos
          </button>
        </div>
      </div>
    );
  }

  const canAccess = course.tierRequired === 'FREE' || user?.planCode === 'PRO';
  const totalLessons = course.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0;
  const totalDuration = course.modules?.reduce(
    (sum, m) => sum + (m.lessons?.reduce((s, l) => s + (l.duration || 0), 0) || 0),
    0
  ) || 0;

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }

    if (!canAccess) {
      alert('Este curso requiere una suscripción PRO');
      navigate(ROUTES.PLANS);
      return;
    }

    if (!courseId) return;

    setIsEnrolling(true);
    try {
      await enroll(courseId);
      alert('¡Inscripción exitosa!');
      // Navigate to first lesson if available
      if (course.modules && course.modules[0]?.lessons && course.modules[0].lessons[0]) {
        navigate(`/course/${courseId}/lesson/${course.modules[0].lessons[0].id}`);
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Error al inscribirse en el curso. Por favor intenta de nuevo.');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleStartLesson = (lessonId: number) => {
    if (!canAccess) {
      navigate(ROUTES.PLANS);
      return;
    }
    navigate(`/course/${courseId}/lesson/${lessonId}`);
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: COLORS.background,
      paddingTop: isAuthenticated ? (isMobile ? '72px' : '84px') : '0',
      paddingBottom: isAuthenticated && isMobile ? '80px' : '0',
      overflowX: 'hidden',
      boxSizing: 'border-box',
    }}>
      {/* Header */}
      {isAuthenticated ? (
        <AppHeader userRole={userRole} />
      ) : (
        <header style={{
          padding: isMobile ? '16px 20px' : '20px 80px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}
            onClick={() => navigate(ROUTES.HOME)}
          >
            <img src="/logo.svg" alt="Logo" style={{ width: isMobile ? '40px' : '50px', height: isMobile ? '32px' : '40px' }} />
            <h1 style={{
              fontFamily: 'sans-serif',
              fontSize: isMobile ? '18px' : '24px',
              fontWeight: '100',
              color: 'white',
              margin: 0,
            }}>
              Investiga <span style={{ fontWeight: 'bold', color: COLORS.primary }}>ODS</span>
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate(ROUTES.LOGIN)}
              style={{
                padding: isMobile ? '8px 16px' : '10px 24px',
                backgroundColor: 'transparent',
                color: 'white',
                border: '2px solid white',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: isMobile ? '14px' : '16px',
              }}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => navigate(ROUTES.REGISTER)}
              style={{
                padding: isMobile ? '8px 16px' : '10px 24px',
                backgroundColor: COLORS.primary,
                color: COLORS.textDark,
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: isMobile ? '14px' : '16px',
              }}
            >
              Registrarse
            </button>
          </div>
        </header>
      )}

      {/* Hero Section */}
      <section style={{
        padding: isMobile ? '40px 20px' : '60px 80px',
        backgroundImage: `linear-gradient(rgba(6, 40, 96, 0.85), rgba(6, 40, 96, 0.85)), url(${course.thumbnailUrl || 'https://via.placeholder.com/800x400'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
        <div style={{ maxWidth: '900px' }}>
          {/* Badges */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <span style={{
              padding: '8px 16px',
              backgroundColor: course.tierRequired === 'PRO' ? COLORS.primary : '#888',
              color: COLORS.textDark,
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 'bold',
            }}>
              {course.tierRequired}
            </span>
            <span style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 'bold',
            }}>
              {course.level || 'BEGINNER'}
            </span>
          </div>

          <h1 style={{
            fontSize: isMobile ? '32px' : '48px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '20px',
            lineHeight: '1.2',
          }}>
            {course.title}
          </h1>

          <p style={{
            fontSize: isMobile ? '16px' : '20px',
            color: 'white',
            marginBottom: '30px',
            lineHeight: '1.6',
          }}>
            {course.summary || course.description}
          </p>

          <div style={{
            display: 'flex',
            gap: isMobile ? '15px' : '30px',
            fontSize: isMobile ? '14px' : '16px',
            color: 'white',
            marginBottom: '30px',
            flexWrap: 'wrap',
          }}>
            <span>👤 {course.owner?.firstName} {course.owner?.lastName}</span>
            <span>📚 {totalLessons} lecciones</span>
            {totalDuration > 0 && (
              <span>⏱️ {Math.floor(totalDuration / 60)}h {totalDuration % 60}min</span>
            )}
          </div>

          {!canAccess && (
            <div style={{
              backgroundColor: 'rgba(255, 107, 107, 0.2)',
              border: '2px solid #ff6b6b',
              borderRadius: '10px',
              padding: '15px 20px',
              marginBottom: '20px',
              color: 'white',
            }}>
              🔒 Este curso requiere una suscripción <strong>PRO</strong>
            </div>
          )}

          <button
            onClick={handleEnroll}
            disabled={isEnrolled || isEnrolling}
            style={{
              padding: isMobile ? '12px 24px' : '16px 40px',
              backgroundColor: isEnrolled ? '#888' : COLORS.primary,
              color: isEnrolled ? '#ccc' : COLORS.textDark,
              border: 'none',
              borderRadius: '10px',
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: 'bold',
              cursor: isEnrolled || isEnrolling ? 'not-allowed' : 'pointer',
              opacity: isEnrolling ? 0.7 : 1,
            }}
          >
            {isEnrolling 
              ? 'Inscribiendo...' 
              : !isAuthenticated 
                ? 'Iniciar Sesión para Inscribirte' 
                : !canAccess 
                  ? 'Upgrade a PRO para Acceder'
                  : isEnrolled 
                    ? '✓ Ya estás inscrito' 
                    : 'Inscribirse Ahora'}
          </button>
        </div>
      </section>

      {/* Course Content */}
      <section style={{ padding: isMobile ? '40px 16px' : '60px 80px' }}>
        <h2 style={{
          fontSize: isMobile ? '24px' : '36px',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: isMobile ? '24px' : '40px',
        }}>
          Contenido del Curso
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '16px' }}>
          {(course.modules ?? []).map((module, idx) => (
            <div
              key={module.id}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: isMobile ? '10px' : '12px',
                overflow: 'hidden',
              }}
            >
              {/* Module Header */}
              <div style={{
                padding: isMobile ? '16px' : '20px 24px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                <h3 style={{
                  fontSize: isMobile ? '16px' : '20px',
                  fontWeight: 'bold',
                  color: 'white',
                  margin: 0,
                  lineHeight: 1.3,
                }}>
                  Módulo {idx + 1}: {module.title}
                </h3>
              </div>

              {/* Lessons */}
              <div style={{ padding: isMobile ? '4px 0' : '8px 0' }}>
                {(module.lessons ?? []).map((lesson) => (
                  <div
                    key={lesson.id}
                    onClick={() => isEnrolled && canAccess && handleStartLesson(lesson.id)}
                    style={{
                      padding: isMobile ? '12px 16px' : '16px 24px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: isEnrolled && canAccess ? 'pointer' : 'default',
                      transition: 'background-color 0.2s',
                      gap: isMobile ? '12px' : '15px',
                    }}
                    onMouseOver={(e) => {
                      if (isEnrolled && canAccess) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      }
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '15px', flex: 1 }}>
                      <div style={{
                        width: isMobile ? '26px' : '28px',
                        height: isMobile ? '26px' : '28px',
                        minWidth: isMobile ? '26px' : '28px',
                        borderRadius: '50%',
                        backgroundColor: canAccess ? COLORS.primary : '#888',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: COLORS.textDark,
                        fontSize: isMobile ? '11px' : '13px',
                      }}>
                        {canAccess ? '▶' : '🔒'}
                      </div>
                      <span style={{
                        fontSize: isMobile ? '14px' : '15px',
                        color: 'white',
                        fontWeight: '500',
                        lineHeight: 1.4,
                      }}>
                        {lesson.title}
                      </span>
                    </div>
                    <span style={{
                      fontSize: isMobile ? '12px' : '13px',
                      color: 'rgba(255, 255, 255, 0.6)',
                      whiteSpace: 'nowrap',
                      marginLeft: isMobile ? '8px' : '0',
                    }}>
                      {(lesson as any).durationMin || lesson.duration || 0} min
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* Bottom Navigation for mobile authenticated users */}
      {isAuthenticated && isMobile && <BottomNavigation role={userRole} />}
      
      {/* Help Button */}
      <HelpButton show={user?.role === 'STUDENT'} />
    </div>
  );
};
