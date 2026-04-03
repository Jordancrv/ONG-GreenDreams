import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { AppHeader } from '../../components/AppHeader';
import { BottomNavigation } from '../../components/mobile';
import { theme } from '../../styles/theme';
import { ROUTES } from '../../utils/constants';
import { coursesService } from '../../services/api.service';
import type { Course, Enrollment } from '../../types';

interface CourseWithStudents extends Course {
  enrollments?: Enrollment[];
  studentCount?: number;
}

export const InstructorStudents: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMobile } = useBreakpoint();
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState<CourseWithStudents[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [students, setStudents] = useState<Enrollment[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    // Check if courseId is in URL params
    const courseIdParam = searchParams.get('courseId');
    if (courseIdParam && courses.length > 0) {
      const courseId = Number(courseIdParam);
      if (!isNaN(courseId)) {
        loadStudents(courseId);
      }
    }
  }, [searchParams, courses]);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const fetchedCourses = await coursesService.getMyCourses();
      
      // Load student count for each course
      const coursesWithCounts = await Promise.all(
        fetchedCourses.map(async (course) => {
          try {
            const stats = await coursesService.getStats(course.id);
            return {
              ...course,
              studentCount: stats.students?.total || 0,
            };
          } catch (err) {
            return {
              ...course,
              studentCount: 0,
            };
          }
        })
      );
      
      setCourses(coursesWithCounts);
    } catch (err) {
      console.error('Error loading courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudents = async (courseId: number) => {
    try {
      setLoadingStudents(true);
      setSelectedCourse(courseId);
      
      // Update URL with courseId query param
      navigate(`/instructor/students?courseId=${courseId}`, { replace: true });
      
      const enrollments = await coursesService.getStudents(courseId);
      setStudents(enrollments);
    } catch (err) {
      console.error('Error loading students:', err);
      alert('Error al cargar los estudiantes');
    } finally {
      setLoadingStudents(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { bg: 'rgba(93, 187, 70, 0.2)', color: theme.colors.primary };
      case 'COMPLETED':
        return { bg: 'rgba(66, 135, 245, 0.2)', color: '#4287f5' };
      case 'DROPPED':
        return { bg: 'rgba(255, 107, 107, 0.2)', color: '#ff6b6b' };
      default:
        return { bg: 'rgba(255, 255, 255, 0.1)', color: 'white' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Activo';
      case 'COMPLETED':
        return 'Completado';
      case 'DROPPED':
        return 'Abandonado';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
              Estudiantes
            </h1>
            <p style={{
              fontSize: isMobile ? '14px' : '18px',
              color: 'rgba(255, 255, 255, 0.7)',
            }}>
              Gestiona los estudiantes de tus cursos
            </p>
          </div>
        </div>

        {/* Courses Selection */}
        <div style={{
          marginBottom: isMobile ? '24px' : '40px',
        }}>
          <h2 style={{
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: isMobile ? '16px' : '20px',
          }}>
            Selecciona un Curso
          </h2>

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
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
            }}>
              No tienes cursos aún
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: isMobile ? '12px' : '20px',
            }}>
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => loadStudents(course.id)}
                  style={{
                    padding: isMobile ? '16px' : '20px',
                    backgroundColor: selectedCourse === course.id 
                      ? 'rgba(93, 187, 70, 0.2)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    border: selectedCourse === course.id 
                      ? `2px solid ${theme.colors.primary}` 
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCourse !== course.id) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCourse !== course.id) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                >
                  <h3 style={{
                    fontSize: isMobile ? '16px' : '18px',
                    fontWeight: 'bold',
                    color: 'white',
                    marginBottom: '8px',
                  }}>
                    {course.title}
                  </h3>
                  <div style={{
                    fontSize: isMobile ? '13px' : '14px',
                    color: 'rgba(255, 255, 255, 0.6)',
                  }}>
                    👥 {course.studentCount || 0} estudiantes
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Students List */}
        {selectedCourse && (
          <div>
            <h2 style={{
              fontSize: isMobile ? '20px' : '24px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: isMobile ? '16px' : '20px',
            }}>
              Lista de Estudiantes
            </h2>

            {loadingStudents ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.5)',
              }}>
                ⏳ Cargando estudiantes...
              </div>
            ) : students.length === 0 ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.5)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
              }}>
                No hay estudiantes inscritos en este curso
              </div>
            ) : (
              <>
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
                      gridTemplateColumns: '2fr 2fr 1fr 1fr',
                      padding: '20px 30px',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    }}>
                      {['Estudiante', 'Email', 'Estado', 'Fecha de Inscripción'].map((header) => (
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
                    {students.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 2fr 1fr 1fr',
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
                          {enrollment.user?.firstName} {enrollment.user?.lastName}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: 'rgba(255, 255, 255, 0.7)',
                        }}>
                          {enrollment.user?.email}
                        </div>
                        <div>
                          <span style={{
                            padding: '6px 12px',
                            backgroundColor: getStatusColor(enrollment.status).bg,
                            color: getStatusColor(enrollment.status).color,
                            borderRadius: '15px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}>
                            {getStatusLabel(enrollment.status)}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: 'rgba(255, 255, 255, 0.7)',
                        }}>
                          {formatDate(enrollment.enrolledAt ?? enrollment.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Mobile: Card View */}
                {isMobile && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}>
                    {students.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '12px',
                          padding: '16px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '12px',
                          gap: '12px',
                        }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{
                              fontSize: '16px',
                              fontWeight: 'bold',
                              color: 'white',
                              marginBottom: '4px',
                            }}>
                              {enrollment.user?.firstName} {enrollment.user?.lastName}
                            </h3>
                            <div style={{
                              fontSize: '13px',
                              color: 'rgba(255, 255, 255, 0.6)',
                            }}>
                              {enrollment.user?.email}
                            </div>
                          </div>
                          <span style={{
                            padding: '4px 10px',
                            backgroundColor: getStatusColor(enrollment.status).bg,
                            color: getStatusColor(enrollment.status).color,
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            flexShrink: 0,
                          }}>
                            {getStatusLabel(enrollment.status)}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.5)',
                        }}>
                          📅 Inscrito: {formatDate(enrollment.enrolledAt ?? enrollment.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {isMobile && <BottomNavigation role="INSTRUCTOR" />}
    </div>
  );
};
