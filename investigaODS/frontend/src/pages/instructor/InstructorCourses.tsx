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
  modulesCount?: number;
  lessonsCount?: number;
}

export const InstructorCourses: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMobile } = useBreakpoint();
  const [filter, setFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [courses, setCourses] = useState<CourseWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const fetchedCourses = await coursesService.getMyCourses();

      // Avoid N stats calls (one per course) on this screen.
      // We can still render basic information from my-courses directly.
      const coursesWithDefaults = fetchedCourses.map((course) => ({
        ...course,
        students: 0,
        rating: 0,
        modulesCount: course.modules?.length || 0,
        lessonsCount: 0,
      }));

      setCourses(coursesWithDefaults);
    } catch (err: any) {
      console.error('Error loading courses:', err);
      setError(err.response?.data?.message || 'Error al cargar los cursos');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    if (filter === 'ALL') return true;
    if (filter === 'PUBLISHED') return course.visibility === 'PUBLIC';
    if (filter === 'DRAFT') return course.visibility === 'PRIVATE';
    return true;
  });

  const handleCreateNew = () => {
    navigate(ROUTES.INSTRUCTOR_COURSE_CREATE);
  };

  const handleDelete = async (courseId: number, courseTitle: string) => {
    if (window.confirm(`¿Estás seguro de eliminar "${courseTitle}"?`)) {
      try {
        await coursesService.delete(courseId);
        alert('Curso eliminado exitosamente');
        loadCourses(); // Recargar la lista
      } catch (err: any) {
        console.error('Error deleting course:', err);
        alert(err.response?.data?.message || 'Error al eliminar el curso');
      }
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

      {/* Main Content */}
      <main style={{
        padding: isMobile ? '20px 16px' : '60px 80px',
        maxWidth: isMobile ? '100%' : '1400px',
        margin: '0 auto',
      }}>
        {/* Header Section */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          marginBottom: isMobile ? '24px' : '40px',
          gap: isMobile ? '16px' : '0',
        }}>
          <div>
            <h1 style={{
              fontSize: isMobile ? '28px' : '42px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '10px',
            }}>
              Mis Cursos
            </h1>
            <p style={{
              fontSize: isMobile ? '14px' : '18px',
              color: 'rgba(255, 255, 255, 0.7)',
            }}>
              Gestiona y edita todos tus cursos
            </p>
          </div>

          <button
            onClick={handleCreateNew}
            style={{
              padding: isMobile ? '12px 20px' : '14px 30px',
              backgroundColor: theme.colors.primary,
              color: theme.colors.textDark,
              border: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: isMobile ? '14px' : '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: isMobile ? '16px' : '20px' }}>➕</span>
            Crear Nuevo Curso
          </button>
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '8px' : '15px',
          marginBottom: isMobile ? '20px' : '30px',
          flexWrap: 'wrap',
        }}>
          {(['ALL', 'PUBLISHED', 'DRAFT'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                flex: isMobile ? '1 1 30%' : 'none',
                padding: isMobile ? '10px 16px' : '10px 24px',
                backgroundColor: filter === f ? theme.colors.primary : 'transparent',
                color: filter === f ? theme.colors.textDark : 'white',
                border: `2px solid ${filter === f ? theme.colors.primary : 'rgba(255, 255, 255, 0.3)'}`,
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: isMobile ? '13px' : '14px',
              }}
            >
              {f === 'ALL' ? 'Todos' : f === 'PUBLISHED' ? 'Publicados' : 'Borradores'}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: 'white',
            fontSize: '18px',
          }}>
            ⏳ Cargando cursos...
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: '20px',
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 0, 0, 0.3)',
            marginBottom: '20px',
          }}>
            <p style={{
              color: '#ff6b6b',
              fontSize: '16px',
              margin: 0,
            }}>
              ❌ {error}
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && filteredCourses.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'rgba(255, 255, 255, 0.6)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📚</div>
            <h3 style={{ color: 'white', marginBottom: '10px' }}>
              {filter === 'ALL' ? 'No tienes cursos aún' : 
               filter === 'PUBLISHED' ? 'No tienes cursos publicados' : 
               'No tienes borradores'}
            </h3>
            <p>Comienza creando tu primer curso</p>
          </div>
        )}

        {/* Courses Grid */}
        {!isLoading && !error && filteredCourses.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: isMobile ? '16px' : '30px',
        }}>
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '15px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {/* Course Header */}
              <div style={{
                padding: isMobile ? '16px' : '25px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: isMobile ? '12px' : '15px',
                  gap: '12px',
                }}>
                  <h3 style={{
                    fontSize: isMobile ? '17px' : '20px',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: 0,
                    flex: 1,
                    lineHeight: '1.3',
                  }}>
                    {course.title}
                  </h3>
                  <span style={{
                    padding: isMobile ? '5px 10px' : '6px 12px',
                    backgroundColor: course.visibility === 'PUBLIC' ? 'rgba(93, 187, 70, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                    color: course.visibility === 'PUBLIC' ? theme.colors.primary : '#ff6b6b',
                    borderRadius: '15px',
                    fontSize: isMobile ? '11px' : '12px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }}>
                    {course.visibility === 'PUBLIC' ? 'Público' : 'Oculto'}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  gap: isMobile ? '8px' : '10px',
                  marginBottom: isMobile ? '0' : '15px',
                  flexWrap: 'wrap',
                }}>
                  <span style={{
                    padding: '4px 10px',
                    backgroundColor: course.tierRequired === 'PRO' ? theme.colors.primary : '#888',
                    color: theme.colors.textDark,
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}>
                    {course.tierRequired}
                  </span>
                  <span style={{
                    padding: '4px 10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}>
                    {course.level}
                  </span>
                </div>
              </div>

              {/* Course Stats */}
              <div style={{
                padding: isMobile ? '16px' : '20px 25px',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: isMobile ? '12px' : '15px',
              }}>
                <div>
                  <div style={{
                    fontSize: isMobile ? '22px' : '24px',
                    fontWeight: 'bold',
                    color: 'white',
                  }}>
                    {course.students || 0}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '12px' : '13px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginTop: '4px',
                  }}>
                    Estudiantes
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: isMobile ? '18px' : '24px',
                    fontWeight: 'bold',
                    color: 'white',
                  }}>
                    {course.rating && course.rating > 0 ? `⭐ ${course.rating}` : '-'}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '12px' : '13px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginTop: '4px',
                  }}>
                    Rating
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: isMobile ? '22px' : '24px',
                    fontWeight: 'bold',
                    color: 'white',
                  }}>
                    {course.modulesCount || 0}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '12px' : '13px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginTop: '4px',
                  }}>
                    Módulos
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: isMobile ? '22px' : '24px',
                    fontWeight: 'bold',
                    color: 'white',
                  }}>
                    {course.lessonsCount || 0}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '12px' : '13px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginTop: '4px',
                  }}>
                    Lecciones
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{
                padding: isMobile ? '16px' : '20px 25px',
                display: 'flex',
                gap: isMobile ? '8px' : '10px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                <button
                  onClick={() => navigate(ROUTES.INSTRUCTOR_COURSE_BUILDER(course.id))}
                  style={{
                    flex: 1,
                    padding: isMobile ? '10px 8px' : '12px',
                    backgroundColor: theme.colors.primary,
                    color: theme.colors.textDark,
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: isMobile ? '12px' : '14px',
                  }}
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => navigate(`/instructor/students?courseId=${course.id}`)}
                  style={{
                    flex: 1,
                    padding: isMobile ? '10px 8px' : '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: isMobile ? '12px' : '14px',
                  }}
                >
                  👥{isMobile ? '' : ' Estudiantes'}
                </button>
                <button
                  onClick={() => handleDelete(course.id, course.title)}
                  style={{
                    padding: isMobile ? '10px 12px' : '12px',
                    backgroundColor: 'rgb(167, 38, 38)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: isMobile ? '12px' : '14px',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgb(127, 29, 29)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgb(167, 38, 38)';
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </main>

      {isMobile && <BottomNavigation role="INSTRUCTOR" />}
    </div>
  );
};
