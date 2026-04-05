import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../styles/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useTags } from '../hooks/useTags';
import { useCourseSearch } from '../hooks/useCourseSearch';
import { BottomNavigation, SearchBar, CategoryCard, CourseCard } from '../components/mobile';
import { AppHeader } from '../components/AppHeader';
import { HelpButton } from '../components/HelpButton';
import { useAuth } from '../hooks/useAuth';

// Paleta de colores para las categorías
const CATEGORY_COLORS = [
  '#E63946', // Rojo carmesí
  '#2A9D8F', // Verde azulado
  '#F4A261', // Naranja cálido
  '#8338EC', // Púrpura real
  '#3A86FF', // Azul royal
  '#FB5607', // Naranja vibrante
  '#06A77D', // Verde jade
  '#C1121F', // Rojo cereza
  '#457B9D', // Azul acero
  '#E9C46A', // Dorado otoñal
  '#6A4C93', // Morado profundo
  '#06D6A0', // Verde esmeralda
];

// Función para obtener color basado en el índice
const getCategoryColor = (index: number): string => {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
};

type FilterType = 'ALL' | 'FREE' | 'PRO';

export const Explore: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const { user } = useAuth();
  const {
    tags,
    currentPage: tagsPage,
    totalPages: tagsTotalPages,
    hasPreviousPage: hasPreviousTagsPage,
    hasNextPage: hasNextTagsPage,
    goToPage: goToTagsPage,
    isLoading: isLoadingTags,
  } = useTags();
  const {
    courses: searchResults,
    total,
    totalPages,
    isLoading: isSearching,
    searchCourses,
    clearSearch,
  } = useCourseSearch();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Reset pagination when search criteria change.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filter]);

  // Perform search when criteria or page changes.
  useEffect(() => {
    const tierFilter = filter === 'FREE' ? 'FREE' : filter === 'PRO' ? 'PRO' : 'ALL';
    const hasQuery = searchQuery.trim().length > 0;
    const hasTierOnlyFilter = tierFilter !== 'ALL';

    if (hasQuery || hasTierOnlyFilter) {
      setIsSearchActive(true);
      searchCourses(searchQuery, tierFilter, currentPage, 9);
    } else {
      setIsSearchActive(false);
      clearSearch();
    }
  }, [searchQuery, filter, currentPage, searchCourses, clearSearch]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const userRole = user?.role === 'INSTRUCTOR' ? 'INSTRUCTOR' : 
                   user?.role === 'ADMIN' ? 'ADMIN' :
                   user?.planCode === 'PRO' ? 'STUDENT_PRO' : 'STUDENT_FREE';

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
        padding: isMobile ? '20px 16px' : '40px 80px',
        maxWidth: '1400px',
        margin: '0 auto',
        boxSizing: 'border-box',
        width: '100%',
      }}>
        {/* Search Section */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{
            fontSize: isMobile ? theme.typography.fontSize['2xl'] : theme.typography.fontSize['3xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.textPrimary,
            margin: 0,
            marginBottom: '16px',
          }}>
            Buscar por nombre
          </h2>
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
          />

          {/* Filters */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginTop: '16px',
          }}>
            {(['ALL', 'FREE', 'PRO'] as FilterType[]).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: filter === filterType ? theme.colors.primary : 'transparent',
                  color: filter === filterType ? '#062860' : theme.colors.textPrimary,
                  border: `2px solid ${theme.colors.primary}`,
                  borderRadius: theme.borderRadius.full,
                  cursor: 'pointer',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.semibold,
                  transition: 'all 0.2s',
                }}
              >
                {filterType === 'ALL' ? 'Todos' : filterType === 'FREE' ? 'Gratuito' : 'PRO'}
              </button>
            ))}
          </div>
        </section>

        {/* Search Results */}
        {isSearchActive && (
          <section style={{ marginBottom: '32px' }}>
            <h3 style={{
              fontSize: isMobile ? theme.typography.fontSize.xl : theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.textPrimary,
              margin: 0,
              marginBottom: '16px',
            }}>
              Resultados de busqueda ({isSearching ? '...' : total})
            </h3>

            {isSearching ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: theme.colors.textSecondary,
              }}>
                Buscando cursos...
              </div>
            ) : searchResults.length > 0 ? (
              <div style={{
                display: isMobile ? 'flex' : 'grid',
                flexDirection: isMobile ? 'column' : undefined,
                gridTemplateColumns: isMobile ? undefined : 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: isMobile ? '0' : '20px',
                width: '100%',
                maxWidth: '100%',
              }}>
                {searchResults.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => {
                      if (course.id) {
                        navigate(`/courses/${course.id}`);
                      }
                    }}
                    style={{ cursor: 'pointer', width: '100%', maxWidth: '100%' }}
                  >
                    <CourseCard 
                      title={course.title}
                      instructor={`${course.owner?.firstName || ''} ${course.owner?.lastName || ''}`.trim() || 'Instructor'}
                      thumbnailUrl={course.thumbnailUrl || 'https://via.placeholder.com/300x200'}
                    />
                  </div>
                ))}
              </div>
            ) : null}

            {!isSearching && totalPages > 1 ? (
              <div style={{
                marginTop: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 14px',
                    borderRadius: theme.borderRadius.full,
                    border: `1px solid ${theme.colors.primary}`,
                    backgroundColor: 'transparent',
                    color: theme.colors.textPrimary,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.6 : 1,
                  }}
                >
                  Anterior
                </button>

                <span style={{ color: theme.colors.textSecondary }}>
                  Pagina {currentPage} de {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                  style={{
                    padding: '8px 14px',
                    borderRadius: theme.borderRadius.full,
                    border: `1px solid ${theme.colors.primary}`,
                    backgroundColor: 'transparent',
                    color: theme.colors.textPrimary,
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage >= totalPages ? 0.6 : 1,
                  }}
                >
                  Siguiente
                </button>
              </div>
            ) : (
              !isSearching && searchResults.length === 0 ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: theme.borderRadius.lg,
                }}>
                  <p style={{
                    fontSize: theme.typography.fontSize.lg,
                    color: theme.colors.textSecondary,
                    margin: 0,
                  }}>
                    No se encontraron cursos que coincidan con tu busqueda
                  </p>
                </div>
              ) : null
            )}
          </section>
        )}

        {/* Categories Section */}
        <section>
          <h2 style={{
            fontSize: isMobile ? theme.typography.fontSize['2xl'] : theme.typography.fontSize['3xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.textPrimary,
            margin: 0,
            marginBottom: '16px',
          }}>
            Explorar por Categoría
          </h2>

          {isLoadingTags ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: theme.colors.textSecondary,
            }}>
              Cargando categorías...
            </div>
          ) : tags.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: theme.borderRadius.lg,
            }}>
              <p style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.textSecondary,
                margin: 0,
              }}>
                No hay categorías disponibles
              </p>
            </div>
          ) : (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '16px',
              }}>
                {tags.map((tag, index) => (
                  <div
                    key={tag.id}
                    onClick={() => navigate(`/courses/tag/${encodeURIComponent(tag.name)}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <CategoryCard
                      code={tag.name.substring(0, 3).toUpperCase()}
                      name={tag.name}
                      color={getCategoryColor(index)}
                    />
                  </div>
                ))}
              </div>

              {tagsTotalPages > 1 ? (
                <div style={{
                  marginTop: '20px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}>
                  <button
                    onClick={() => goToTagsPage(tagsPage - 1)}
                    disabled={!hasPreviousTagsPage}
                    style={{
                      padding: '8px 14px',
                      borderRadius: theme.borderRadius.full,
                      border: `1px solid ${theme.colors.primary}`,
                      backgroundColor: 'transparent',
                      color: theme.colors.textPrimary,
                      cursor: !hasPreviousTagsPage ? 'not-allowed' : 'pointer',
                      opacity: !hasPreviousTagsPage ? 0.6 : 1,
                    }}
                  >
                    Anterior
                  </button>

                  <span style={{ color: theme.colors.textSecondary }}>
                    Categorias {tagsPage} de {tagsTotalPages}
                  </span>

                  <button
                    onClick={() => goToTagsPage(tagsPage + 1)}
                    disabled={!hasNextTagsPage}
                    style={{
                      padding: '8px 14px',
                      borderRadius: theme.borderRadius.full,
                      border: `1px solid ${theme.colors.primary}`,
                      backgroundColor: 'transparent',
                      color: theme.colors.textPrimary,
                      cursor: !hasNextTagsPage ? 'not-allowed' : 'pointer',
                      opacity: !hasNextTagsPage ? 0.6 : 1,
                    }}
                  >
                    Siguiente
                  </button>
                </div>
              ) : null}
            </>
          )}
        </section>

        {/* Featured Course Banner */}
        <section style={{ marginTop: '40px' }}>
          <div style={{
            padding: isMobile ? '24px' : '40px',
            backgroundColor: 'rgba(93, 187, 70, 0.1)',
            borderRadius: theme.borderRadius.lg,
            border: `2px solid ${theme.colors.primary}`,
          }}>
            <h3 style={{
              fontSize: isMobile ? theme.typography.fontSize.xl : theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.textPrimary,
              margin: 0,
              marginBottom: '12px',
            }}>
              Curso Destacado
            </h3>
            <p style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.textSecondary,
              margin: 0,
              marginBottom: '20px',
            }}>
              Aprende sobre reciclaje orgánico y compostaje con expertos en la materia
            </p>
            <button
              onClick={() => navigate('/courses/1')}
              style={{
                padding: '12px 24px',
                backgroundColor: theme.colors.primary,
                color: '#062860',
                border: 'none',
                borderRadius: theme.borderRadius.md,
                cursor: 'pointer',
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
              }}
            >
              Ver curso
            </button>
          </div>
        </section>

        {isMobile && <div style={{ height: '20px' }} />}
      </main>

      {/* Bottom Navigation */}
      {isMobile && <BottomNavigation role={userRole} />}

      {/* Help Button */}
      <HelpButton show={user?.role === 'STUDENT'} />
    </div>
  );
};
