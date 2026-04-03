import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Menu, X, CheckCircle, Circle, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useProgress } from '../hooks/useProgress';
import { coursesService } from '../services/api.service';
import { LogoutModal } from '../components/LogoutModal';
import { theme } from '../styles/theme';
import { ROUTES } from '../utils/constants';
import type { Course, Lesson as LessonType, Module as ModuleType } from '../types';

export const CourseLessonPage: React.FC = () => {
  const navigate = useNavigate();
  const { courseId: courseIdParam, lessonId: lessonIdParam } = useParams<{ courseId: string; lessonId: string }>();
  const { isAuthenticated, logout } = useAuth();
  const { isMobile } = useBreakpoint();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  const mainContentRef = React.useRef<HTMLDivElement>(null);
  
  const courseId = courseIdParam ? parseInt(courseIdParam) : null;
  const lessonId = lessonIdParam ? parseInt(lessonIdParam) : null;
  
  const { progress, updateLessonProgress } = useProgress(courseId);

  // Load course outline
  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) return;
      
      setIsLoadingCourse(true);
      try {
        const courseData = await coursesService.getOutline(courseId);
        setCourse(courseData);
      } catch (error) {
        console.error('Error loading course:', error);
      } finally {
        setIsLoadingCourse(false);
      }
    };

    loadCourse();
  }, [courseId]);

  // Scroll to top when lesson changes
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
    // Also try window scroll as fallback
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [lessonId]);

  // Find current lesson
  let currentLesson: LessonType | null = null;
  let currentModule: ModuleType | null = null;
  
  if (course && lessonId) {
    for (const module of course.modules || []) {
      const found = module.lessons?.find((l: LessonType) => l.id === lessonId);
      if (found) {
        currentLesson = found;
        currentModule = module;
        break;
      }
    }
  }

  // Mark lesson as viewed when opened
  useEffect(() => {
    const markAsViewed = async () => {
      if (lessonId && currentLesson) {
        try {
          // Update progress to at least 10% when viewing
          const lessonProgress = progress?.lessons?.find((l: any) => l.lessonId === lessonId);
          if (!lessonProgress || lessonProgress.progressPct < 10) {
            await updateLessonProgress(lessonId, 10, false);
          }
        } catch (error) {
          console.error('Error updating lesson progress:', error);
        }
      }
    };

    markAsViewed();
  }, [lessonId, currentLesson]);

  const handleMarkAsComplete = async () => {
    if (!lessonId) return;
    
    try {
      await updateLessonProgress(lessonId, 100, true);
      
      // Find next lesson
      if (course && currentModule) {
        const currentModuleIndex = course.modules?.findIndex((m: ModuleType) => m.id === currentModule.id) ?? -1;
        const currentLessonIndex = currentModule.lessons?.findIndex(l => l.id === lessonId) ?? -1;
        
        // Check if there's a next lesson in current module
        if (currentLessonIndex < (currentModule.lessons?.length ?? 0) - 1) {
          const nextLesson = currentModule.lessons?.[currentLessonIndex + 1];
          if (nextLesson) {
            navigate(`/course/${courseId}/lesson/${nextLesson.id}`);
          }
        }
        // Check if there's a next module
        else if (currentModuleIndex < (course.modules?.length ?? 0) - 1) {
          const nextModule = course.modules?.[currentModuleIndex + 1];
          const firstLesson = nextModule?.lessons?.[0];
          if (firstLesson) {
            navigate(`/course/${courseId}/lesson/${firstLesson.id}`);
          }
        }
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  };

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
    navigate(ROUTES.HOME);
  };

  const handleLessonClick = (newLessonId: number) => {
    navigate(`/course/${courseId}/lesson/${newLessonId}`);
    setShowSidebar(false);
  };

  const isLessonCompleted = (checkLessonId: number): boolean => {
    return progress?.lessons?.find((l: any) => l.lessonId === checkLessonId)?.completed || false;
  };

  const normalizeMediaUrl = (url?: string): string => {
    if (!url) {
      return '';
    }

    try {
      const parsed = new URL(url);
      if (parsed.hostname === 'investigaods_backend') {
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  const normalizedVideoUrl = normalizeMediaUrl(currentLesson?.videoUrl);
  const isIframeVideo = /youtube\.com|youtu\.be|vimeo\.com/i.test(normalizedVideoUrl);

  if (!isAuthenticated) {
    navigate(ROUTES.LOGIN);
    return null;
  }

  if (isLoadingCourse) {
    return (
      <div style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: theme.colors.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <div style={{ textAlign: 'center', color: theme.colors.textPrimary }}>
          Cargando lección...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate(ROUTES.LOGIN);
    return null;
  }

  if (!course || !currentLesson) {
    return (
      <div style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: theme.colors.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: isMobile ? '24px' : '36px', color: 'white', marginBottom: '20px' }}>
            Lección no encontrada
          </h1>
          <button
            onClick={() => navigate(ROUTES.DASHBOARD_BASIC)}
            style={{
              padding: '12px 24px',
              backgroundColor: theme.colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const currentLessonCompleted = isLessonCompleted(lessonId!);

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      backgroundColor: theme.colors.background,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Header */}
      <header style={{
        padding: '16px 20px',
        backgroundColor: theme.colors.background,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1px solid ${theme.colors.border}`,
        flexShrink: 0,
        zIndex: 90,
        position: 'relative',
      }}>
        <button
          onClick={() => navigate(`/courses/${courseId}`)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: theme.colors.primary,
            cursor: 'pointer',
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: '600',
            padding: '8px',
            zIndex: 1,
          }}
        >
          <ArrowLeft size={20} />
          {!isMobile && 'Volver al curso'}
        </button>

        <h1 style={{
          fontSize: isMobile ? '14px' : '18px',
          fontWeight: 'bold',
          color: theme.colors.textPrimary,
          margin: 0,
          position: isMobile ? 'absolute' : 'relative',
          left: isMobile ? '50%' : 'auto',
          transform: isMobile ? 'translateX(-50%)' : 'none',
          maxWidth: isMobile ? '60%' : 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {course.title}
        </h1>

        <button
          onClick={() => setShowLogoutModal(true)}
          style={{
            background: 'none',
            border: 'none',
            color: theme.colors.textPrimary,
            cursor: 'pointer',
            padding: '8px',
            zIndex: 1,
          }}
          aria-label="Cerrar sesión"
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* Main Content with Sidebar */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Sidebar Overlay (Mobile) */}
        {isMobile && showSidebar && (
          <div
            onClick={() => setShowSidebar(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 998,
            }}
          />
        )}

        {/* Sidebar */}
        <aside style={{
          width: isMobile ? '280px' : '320px',
          backgroundColor: theme.colors.backgroundLight,
          borderRight: `1px solid ${theme.colors.border}`,
          overflowY: 'auto',
          flexShrink: 0,
          position: isMobile ? 'fixed' : 'relative',
          top: isMobile ? 0 : 'auto',
          left: isMobile ? (showSidebar ? 0 : '-280px') : 'auto',
          height: isMobile ? '100vh' : 'auto',
          zIndex: 999,
          transition: 'left 0.3s ease',
          paddingTop: isMobile ? '70px' : '0',
        }}>
          {/* Close button (Mobile) */}
          {isMobile && (
            <button
              onClick={() => setShowSidebar(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: theme.colors.textPrimary,
                cursor: 'pointer',
                padding: '8px',
              }}
            >
              <X size={24} />
            </button>
          )}

          <div style={{ padding: '24px 20px' }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: theme.colors.textPrimary,
              marginBottom: '20px',
              marginTop: 0,
            }}>
              Contenido del Curso
            </h2>

            {course.modules?.map((module: ModuleType) => (
              <div key={module.id} style={{ marginBottom: '24px' }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: theme.colors.primary,
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  {module.title}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {module.lessons?.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => handleLessonClick(lesson.id)}
                      style={{
                        padding: '12px',
                        backgroundColor: lesson.id === lessonId ? 'rgba(93, 187, 70, 0.2)' : 'transparent',
                        border: lesson.id === lessonId ? `1px solid ${theme.colors.primary}` : '1px solid transparent',
                        borderRadius: '8px',
                        color: theme.colors.textPrimary,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                        if (lesson.id !== lessonId) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        }
                      }}
                      onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                        if (lesson.id !== lessonId) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {isLessonCompleted(lesson.id) ? (
                        <CheckCircle size={18} color={theme.colors.primary} style={{ marginTop: '2px', flexShrink: 0 }} />
                      ) : (
                        <Circle size={18} color="rgba(255, 255, 255, 0.4)" style={{ marginTop: '2px', flexShrink: 0 }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: lesson.id === lessonId ? '600' : '500',
                          marginBottom: '4px',
                          lineHeight: 1.4,
                        }}>
                          {lesson.title}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.6)',
                        }}>
                          {(lesson as any).durationMin || lesson.duration || 0} min
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <main
          ref={mainContentRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            backgroundColor: theme.colors.background,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div style={{
            maxWidth: '900px',
            margin: '0 auto',
            padding: isMobile ? '20px 16px 40px 16px' : '40px 60px',
          }}>
            {/* Lesson Title */}
            <h1 style={{
              fontSize: isMobile ? '24px' : '32px',
              fontWeight: 'bold',
              color: theme.colors.textPrimary,
              marginBottom: '8px',
              lineHeight: 1.3,
            }}>
              {currentLesson.title}
            </h1>

            {/* Duration and Progress */}
            <div style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              marginBottom: isMobile ? '24px' : '32px',
            }}>
              {((currentLesson as any)?.durationMin || currentLesson.duration) && (
                <p style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  margin: 0,
                }}>
                  Duración: {(currentLesson as any).durationMin || currentLesson.duration} minutos
                </p>
              )}
              {currentLessonCompleted && (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  color: theme.colors.primary,
                  fontWeight: '600',
                }}>
                  <CheckCircle size={16} />
                  Completada
                </span>
              )}
            </div>

            {/* Video */}
            {normalizedVideoUrl && (
              <div style={{
                marginBottom: isMobile ? '32px' : '40px',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: '#000',
                width: '100%',
                aspectRatio: '16/9',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              }}>
                {isIframeVideo ? (
                  <iframe
                    width="100%"
                    height="100%"
                    src={normalizedVideoUrl}
                    title={currentLesson.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ display: 'block', border: 'none' }}
                  />
                ) : (
                  <video
                    controls
                    style={{ width: '100%', height: '100%', display: 'block' }}
                    src={normalizedVideoUrl}
                  >
                    Tu navegador no soporta reproducción de video.
                  </video>
                )}
              </div>
            )}

            {/* Lesson Content */}
            <div
              style={{
                color: theme.colors.textPrimary,
                fontSize: isMobile ? '15px' : '16px',
                lineHeight: '1.8',
                marginBottom: '32px',
              }}
              dangerouslySetInnerHTML={{ __html: currentLesson.content || '<p>No hay contenido disponible para esta lección.</p>' }}
            />

            {/* Mark as Complete Button */}
            {!currentLessonCompleted && (
              <button
                onClick={handleMarkAsComplete}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: theme.colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  fontWeight: theme.typography.fontWeight.bold,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <CheckCircle size={20} />
                Marcar como completada
              </button>
            )}
          </div>
        </main>
      </div>

      {/* Floating Menu Button (Mobile Only) */}
      {isMobile && (
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '20px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: theme.colors.primary,
            border: 'none',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            transition: 'transform 0.2s',
          }}
          onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Menu size={28} color="white" />
        </button>
      )}

      <LogoutModal 
        isOpen={showLogoutModal}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
};
