import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2 } from 'lucide-react';
import { theme } from '../styles/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { BottomNavigation } from '../components/mobile';
import { AppHeader } from '../components/AppHeader';
import { HelpButton } from '../components/HelpButton';
import { useAuth } from '../hooks/useAuth';
import { useEnrollments } from '../hooks/useEnrollments';
import { progressService, certificatesService, coursesService } from '../services/api.service';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const { user, logout } = useAuth();
  const { enrollments, isLoading: enrollmentsLoading } = useEnrollments();
  const [completedCount, setCompletedCount] = useState(0);
  const [certificatesCount, setCertificatesCount] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  // Instructor stats
  const [instructorStats, setInstructorStats] = useState({
    coursesTeaching: 0,
    totalStudents: 0,
    certificatesIssued: 0,
  });

  const userRole = user?.role === 'INSTRUCTOR' ? 'INSTRUCTOR' : 
                   user?.role === 'ADMIN' ? 'ADMIN' :
                   user?.tier === 'PRO' ? 'STUDENT_PRO' : 'STUDENT_FREE';

  const normalizeAvatarUrl = (url?: string): string => {
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

  const avatarSrc = normalizeAvatarUrl(user?.avatarUrl);
  const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Usuario')}&background=0D3B80&color=fff`;

  // Load instructor stats
  useEffect(() => {
    const loadInstructorStats = async () => {
      if (user?.role !== 'INSTRUCTOR') return;
      
      try {
        setIsLoadingStats(true);
        
        // Get all instructor courses
        const courses = await coursesService.getMyCourses();
        const coursesTeaching = courses.length;
        
        // Get stats for each course and sum up
        let totalStudents = 0;
        let certificatesIssued = 0;
        
        await Promise.all(
          courses.map(async (course) => {
            try {
              const stats = await coursesService.getStats(course.id);
              totalStudents += stats.students?.total || 0;
              certificatesIssued += stats.certificates?.issued || 0;
            } catch (error) {
              console.error(`Error loading stats for course ${course.id}:`, error);
            }
          })
        );
        
        setInstructorStats({
          coursesTeaching,
          totalStudents,
          certificatesIssued,
        });
      } catch (error) {
        console.error('Error loading instructor stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadInstructorStats();
  }, [user?.role]);

  // Load student stats
  useEffect(() => {
    const loadStudentStats = async () => {
      if (!enrollments || enrollments.length === 0 || user?.role === 'INSTRUCTOR') {
        setIsLoadingStats(false);
        return;
      }

      try {
        setIsLoadingStats(true);

        // Count completed courses (100% progress)
        let completed = 0;
        for (const enrollment of enrollments) {
          const courseId = enrollment.course?.id;
          if (courseId) {
            try {
              const progress = await progressService.getCourseProgress(courseId);
              if (progress.progressPct === 100) {
                completed++;
              }
            } catch (error) {
              console.error(`Error loading progress for course ${courseId}:`, error);
            }
          }
        }
        setCompletedCount(completed);

        // Load certificates count
        try {
          const certificates = await certificatesService.getMyCertificates();
          setCertificatesCount(certificates.length);
        } catch (error) {
          console.error('Error loading certificates:', error);
          setCertificatesCount(0);
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadStudentStats();
  }, [enrollments, user?.role]);

  // Stats based on role
  const stats = user?.role === 'INSTRUCTOR' 
    ? {
        enrolled: instructorStats.coursesTeaching,
        completed: instructorStats.totalStudents,
        certificates: instructorStats.certificatesIssued,
      }
    : {
        enrolled: enrollments?.length || 0,
        completed: completedCount,
        certificates: certificatesCount,
      };

  const statsLabels = user?.role === 'INSTRUCTOR' 
    ? ['Cursos\nenseñando', 'Alumnos\ntotales', 'Certificados\nemitidos']
    : ['Cursos\ninscritos', 'Cursos\ncompletados', 'Certificaciones\nobtenidas'];

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: theme.colors.background,
      paddingTop: isMobile ? '72px' : '84px',
      paddingBottom: isMobile ? '80px' : '0',
      overflowX: 'hidden',
      boxSizing: 'border-box',
    }}>
      <AppHeader userRole={userRole} />

      {/* Main Content */}
      <main style={{
        padding: isMobile ? '40px 16px' : '60px 80px',
        maxWidth: '800px',
        boxSizing: 'border-box',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Profile Photo */}
        <div style={{
          position: 'relative',
          marginBottom: '24px',
        }}>
          <div style={{
            width: isMobile ? '140px' : '180px',
            height: isMobile ? '140px' : '180px',
            borderRadius: '50%',
            overflow: 'hidden',
            backgroundColor: theme.colors.card,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img
              src={avatarSrc || avatarFallback}
              alt={`${user?.firstName} ${user?.lastName}`}
              onError={(e) => {
                e.currentTarget.src = avatarFallback;
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
          <button
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: theme.shadows.md,
            }}
            aria-label="Editar foto"
          >
            <Edit2 size={20} color="#062860" />
          </button>
        </div>

        {/* User Name */}
        <h2 style={{
          fontSize: isMobile ? theme.typography.fontSize['2xl'] : theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.textPrimary,
          margin: 0,
          marginBottom: '40px',
          textAlign: 'center',
        }}>
          {user?.firstName} {user?.lastName}
        </h2>

        {/* Stats */}
        {isLoadingStats ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            minHeight: '120px',
            marginBottom: '60px',
          }}>
            <p style={{
              fontSize: theme.typography.fontSize.lg,
              color: theme.colors.textSecondary,
              margin: 0,
            }}>
              Cargando estadísticas...
            </p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            width: '100%',
            gap: '20px',
            marginBottom: '60px',
          }}>
            {[stats.enrolled, stats.completed, stats.certificates].map((value, index) => (
              <div
                key={index}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '16px',
                  borderRight: index < 2 ? `1px solid ${theme.colors.border}` : 'none',
                }}
              >
                <div style={{
                  fontSize: isMobile ? theme.typography.fontSize['3xl'] : theme.typography.fontSize['4xl'],
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.textPrimary,
                  marginBottom: '8px',
                }}>
                  {value}
                </div>
                <div style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.textSecondary,
                  whiteSpace: 'pre-line',
                  lineHeight: '1.4',
                }}>
                  {statsLabels[index]}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          width: '100%',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <button
            onClick={() => navigate('/profile/edit')}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: theme.colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.semibold,
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Editar perfil
          </button>

          <button
            onClick={logout}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: 'transparent',
              color: theme.colors.textPrimary,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.semibold,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Cerrar sesión
          </button>
        </div>

        {/* Spacer for mobile bottom navigation */}
        {isMobile && <div style={{ height: '20px' }} />}
      </main>

      {/* Bottom Navigation */}
      {isMobile && <BottomNavigation role={userRole} />}

      {/* Help Button */}
      <HelpButton show={user?.role === 'STUDENT'} />
    </div>
  );
};
