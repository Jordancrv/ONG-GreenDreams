import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { AppHeader } from '../../components/AppHeader';
import { BottomNavigation } from '../../components/mobile';
import { theme } from '../../styles/theme';
import { ROUTES } from '../../utils/constants';
import { coursesService } from '../../services/api.service';
import type { Course } from '../../types';

interface CourseWithStats extends Course {
  students?: number;
  rating?: number;
}

interface InstructorStats {
  totalCourses: number;
  totalStudents: number;
  activeCourses: number;
  pendingReviews: number;
}

export const InstructorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMobile } = useBreakpoint();
  const [stats, setStats] = useState<InstructorStats>({
    totalCourses: 0,
    totalStudents: 0,
    activeCourses: 0,
    pendingReviews: 0,
  });
  const [courses, setCourses] = useState<CourseWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInstructorData();
  }, []);

  const loadInstructorData = async () => {
    try {
      setIsLoading(true);
      
      // Load instructor's courses
      const fetchedCourses = await coursesService.getMyCourses();

      // Fetch stats once per course and reuse for both cards and totals
      const coursesWithAllStats = await Promise.all(
        fetchedCourses.map(async (course) => {
          try {
            const courseStats = await coursesService.getStats(course.id);
            return {
              ...course,
              students: courseStats.students?.total || 0,
              rating: courseStats.rating || 0,
            };
          } catch (err) {
            return {
              ...course,
              students: 0,
              rating: 0,
            };
          }
        }),
      );

      // Show only first 2 courses in dashboard cards
      setCourses(coursesWithAllStats.slice(0, 2));

      // Calculate overall stats from already fetched values
      let totalStudents = 0;
      let activeCourses = 0;

      for (const course of coursesWithAllStats) {
        totalStudents += course.students || 0;
        if (course.visibility === 'PUBLIC') {
          activeCourses++;
        }
      }
      
      setStats({
        totalCourses: coursesWithAllStats.length,
        totalStudents,
        activeCourses,
        pendingReviews: 0, // TODO: Implement reviews system
      });
      
    } catch (err) {
      console.error('Error loading instructor data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: theme.colors.background,
      paddingTop: isMobile ? '72px' : '84px',
      paddingBottom: isMobile ? '90px' : '0',
      boxSizing: 'border-box',
      overflowX: 'hidden',
    }}>
      <AppHeader userRole="INSTRUCTOR" />

      <main style={{
        padding: isMobile ? '20px 16px' : '60px 80px',
        maxWidth: isMobile ? '100%' : '1400px',
        margin: '0 auto',
      }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: isMobile ? '24px' : '40px' }}>
          <h1 style={{
            fontSize: isMobile ? '28px' : '42px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '10px',
          }}>
            Panel de Instructor
          </h1>
          <p style={{
            fontSize: isMobile ? '14px' : '18px',
            color: 'rgba(255, 255, 255, 0.7)',
          }}>
            Bienvenido, {user?.firstName}! Administra tus cursos y estudiantes
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: isMobile ? '12px' : '25px',
          marginBottom: isMobile ? '24px' : '50px',
        }}>
          {isLoading ? (
            // Loading skeleton
            [1, 2, 3, 4].map((idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  padding: isMobile ? '16px' : '30px',
                  borderRadius: '15px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  minHeight: isMobile ? '100px' : '150px',
                }}
              >
                <div style={{
                  fontSize: isMobile ? '24px' : '36px',
                  marginBottom: '10px',
                  opacity: 0.3,
                }}>
                  ⏳
                </div>
              </div>
            ))
          ) : (
            [
              { label: 'Total Cursos', value: stats.totalCourses, icon: '📚', color: theme.colors.primary },
              { label: 'Total Estudiantes', value: stats.totalStudents, icon: '👥', color: theme.colors.secondary },
              { label: 'Cursos Activos', value: stats.activeCourses, icon: '✅', color: theme.colors.primary },
              { label: 'Revisiones Pendientes', value: stats.pendingReviews, icon: '📝', color: '#ff6b6b' },
            ].map((stat, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  padding: isMobile ? '16px' : '30px',
                  borderRadius: '15px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <div style={{
                  fontSize: isMobile ? '24px' : '36px',
                  marginBottom: '10px',
                }}>
                  {stat.icon}
                </div>
                <div style={{
                  fontSize: isMobile ? '20px' : '32px',
                  fontWeight: 'bold',
                  color: stat.color,
                  marginBottom: '5px',
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: isMobile ? '11px' : '14px',
                  color: 'rgba(255, 255, 255, 0.7)',
                }}>
                  {stat.label}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: isMobile ? '24px' : '50px' }}>
          <h2 style={{
            fontSize: isMobile ? '20px' : '28px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: isMobile ? '16px' : '25px',
          }}>
            Acciones Rápidas
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: isMobile ? '12px' : '20px',
          }}>
            <button
              onClick={() => navigate(ROUTES.INSTRUCTOR_COURSE_CREATE)}
              style={{
                padding: isMobile ? '16px' : '25px',
                backgroundColor: theme.colors.primary,
                color: theme.colors.textDark,
                border: 'none',
                borderRadius: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: isMobile ? '14px' : '16px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
              }}
            >
              <span style={{ fontSize: '32px' }}>➕</span>
              <span>Crear Nuevo Curso</span>
            </button>

            <button
              onClick={() => navigate(ROUTES.INSTRUCTOR_COURSES)}
              style={{
                padding: '25px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '16px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
              }}
            >
              <span style={{ fontSize: '32px' }}>📚</span>
              <span>Gestionar Mis Cursos</span>
            </button>

            <button
              onClick={() => alert('Próximamente: Sistema de mensajería')}
              style={{
                padding: '25px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '16px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
              }}
            >
              <span style={{ fontSize: '32px' }}>💬</span>
              <span>Ver Mensajes</span>
            </button>
          </div>
        </div>

        {/* My Courses Table */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: isMobile ? '20px' : '25px',
          }}>
            <h2 style={{
              fontSize: isMobile ? '22px' : '28px',
              fontWeight: 'bold',
              color: 'white',
              margin: 0,
            }}>
              Mis Cursos
            </h2>
            <button
              onClick={() => navigate(ROUTES.INSTRUCTOR_COURSES)}
              style={{
                padding: isMobile ? '8px 16px' : '10px 20px',
                backgroundColor: 'transparent',
                color: theme.colors.primary,
                border: `2px solid ${theme.colors.primary}`,
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: isMobile ? '12px' : '14px',
              }}
            >
              Ver Todos
            </button>
          </div>

          {/* Desktop: Table View */}
          {!isMobile && (
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '15px',
              overflow: 'hidden',
            }}>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 150px',
                padding: '20px 30px',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                {['Curso', 'Estudiantes', 'Rating', 'Estado', 'Acciones'].map((header) => (
                  <div
                    key={header}
                    style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: 'rgba(255, 255, 255, 0.7)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {header}
                  </div>
                ))}
              </div>

              {/* Table Rows */}
              {isLoading ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}>
                  ⏳ Cargando cursos...
                </div>
              ) : courses.length === 0 ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}>
                  No tienes cursos aún
                </div>
              ) : (
                courses.map((course) => (
                <div
                  key={course.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 150px',
                    padding: '20px 30px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    alignItems: 'center',
                  }}
                >
                  <div style={{
                    fontSize: '16px',
                    color: 'white',
                    fontWeight: '500',
                  }}>
                    {course.title}
                  </div>
                  <div style={{
                    fontSize: '16px',
                    color: 'white',
                  }}>
                    {course.students}
                  </div>
                  <div style={{
                    fontSize: '16px',
                    color: 'white',
                  }}>
                    {course.rating && course.rating > 0 ? `⭐ ${course.rating.toFixed(1)}` : '-'}
                  </div>
                  <div>
                    <span style={{
                      padding: '6px 12px',
                      backgroundColor: course.visibility === 'PUBLIC' ? 'rgba(93, 187, 70, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                      color: course.visibility === 'PUBLIC' ? theme.colors.primary : '#ff6b6b',
                      borderRadius: '15px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}>
                      {course.visibility === 'PUBLIC' ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => navigate(ROUTES.INSTRUCTOR_COURSE_BUILDER(course.id))}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: theme.colors.primary,
                        color: theme.colors.textDark,
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => navigate(`${ROUTES.INSTRUCTOR_STUDENTS}?courseId=${course.id}`)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Ver
                    </button>
                  </div>
                </div>
                ))
              )}
            </div>
          )}

          {/* Mobile: Card View */}
          {isMobile && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              {isLoading ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.5)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                }}>
                  ⏳ Cargando cursos...
                </div>
              ) : courses.length === 0 ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.5)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                }}>
                  No tienes cursos aún
                </div>
              ) : (
                courses.map((course) => (
                <div
                  key={course.id}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {/* Course Title and Status */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '16px',
                    gap: '12px',
                  }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: 'white',
                      margin: 0,
                      flex: 1,
                      lineHeight: '1.3',
                    }}>
                      {course.title}
                    </h3>
                    <span style={{
                      padding: '4px 10px',
                      backgroundColor: course.visibility === 'PUBLIC' ? 'rgba(93, 187, 70, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                      color: course.visibility === 'PUBLIC' ? theme.colors.primary : '#ff6b6b',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      flexShrink: 0,
                    }}>
                      {course.visibility === 'PUBLIC' ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    marginBottom: '16px',
                  }}>
                    <div>
                      <div style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: 'white',
                      }}>
                        {course.students}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        marginTop: '4px',
                      }}>
                        Estudiantes
                      </div>
                    </div>
                    <div>
                      <div style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: 'white',
                      }}>
                        {course.rating && course.rating > 0 ? `⭐ ${course.rating.toFixed(1)}` : '-'}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        marginTop: '4px',
                      }}>
                        Rating
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                  }}>
                    <button
                      onClick={() => navigate(ROUTES.INSTRUCTOR_COURSE_BUILDER(course.id))}
                      style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: theme.colors.primary,
                        color: theme.colors.textDark,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 'bold',
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => navigate(`${ROUTES.INSTRUCTOR_STUDENTS}?courseId=${course.id}`)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 'bold',
                      }}
                    >
                      Ver
                    </button>
                  </div>
                </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {isMobile && <BottomNavigation role="INSTRUCTOR" />}
    </div>
  );
};
