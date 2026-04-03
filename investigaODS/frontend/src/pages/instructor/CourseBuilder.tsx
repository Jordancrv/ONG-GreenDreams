import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { AppHeader } from '../../components/AppHeader';
import { BottomNavigation } from '../../components/mobile';
import { theme } from '../../styles/theme';
import { ROUTES } from '../../utils/constants';
import { coursesService, filesService, tagsService } from '../../services/api.service';
import type { Course } from '../../types';

interface Tag {
  id: number;
  name: string;
}

type LessonAttachment = {
  name: string;
  url: string;
  mimetype?: string;
  size?: number;
  filename?: string;
};

export const CourseBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const { isMobile } = useBreakpoint();

  const [courseData, setCourseData] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'INFO' | 'MODULES' | 'SETTINGS'>('INFO');
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});
  
  // Form data for editing
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'BEGINNER',
    tierRequired: 'FREE',
    visibility: 'PRIVATE' as 'PUBLIC' | 'PRIVATE',
    tags: [] as string[],
  });
  
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState('');
  
  // Modal states for adding modules/lessons
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleSummary, setModuleSummary] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonDuration, setLessonDuration] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonAttachments, setLessonAttachments] = useState<LessonAttachment[]>([]);
  const [selectedLessonFile, setSelectedLessonFile] = useState<File | null>(null);
  const [isUploadingLessonFile, setIsUploadingLessonFile] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadCourse();
      loadTags();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const loadCourse = async () => {
    if (!courseId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Load both course data (with tags) and outline (with modules) in parallel
      const [courseData, outlineData] = await Promise.all([
        coursesService.getById(Number(courseId)),
        coursesService.getOutline(Number(courseId))
      ]);
      
      // Merge data: use course data but include modules from outline
      const fullCourse = {
        ...courseData,
        modules: outlineData.modules || []
      };
      
      setCourseData(fullCourse);
      
      // Initialize form data with course data
      let tagNames: string[] = [];
      if (fullCourse.tags && Array.isArray(fullCourse.tags)) {
        tagNames = fullCourse.tags.map((t: any) => {
          if (typeof t === 'string') {
            return t;
          } else if (t && typeof t === 'object' && t.name) {
            return t.name;
          }
          return '';
        }).filter(name => name !== '');
      }
      
      setFormData({
        title: fullCourse.title,
        description: fullCourse.description || '',
        level: fullCourse.level || 'BEGINNER',
        tierRequired: fullCourse.tierRequired,
        visibility: fullCourse.visibility,
        tags: tagNames,
      });
    } catch (err: any) {
      console.error('Error loading course:', err);
      console.error('Error details:', err.response);
      setError(err.response?.data?.message || 'Error al cargar el curso');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const tags = await tagsService.getAll();
      setAvailableTags(tags);
    } catch (err: any) {
      console.error('Error loading tags:', err);
      setAvailableTags([]);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleTag = (tagName: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagName)
        ? prev.tags.filter(t => t !== tagName)
        : [...prev.tags, tagName],
    }));
  };

  const addNewTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag],
      }));
      
      if (!availableTags.some(tag => tag.name === trimmedTag)) {
        setAvailableTags(prev => [...prev, { id: Date.now(), name: trimmedTag }]);
      }
      
      setNewTag('');
    }
  };

  if (isLoading) {
    return (
      <div style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: theme.colors.background,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <div style={{ color: 'white', fontSize: '24px' }}>
          ⏳ Cargando curso...
        </div>
      </div>
    );
  }

  if (error || !courseData) {
    return (
      <div style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: theme.colors.background,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px',
        padding: '20px',
      }}>
        <div style={{ color: 'white', fontSize: '24px' }}>
          {error || 'Curso no encontrado'}
        </div>
        <button
          onClick={() => navigate(ROUTES.INSTRUCTOR_COURSES)}
          style={{
            padding: '12px 24px',
            backgroundColor: theme.colors.primary,
            color: theme.colors.textDark,
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          ← Volver a Mis Cursos
        </button>
      </div>
    );
  }

  const toggleModule = (moduleId: number) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const handleCancel = () => {
    if (window.confirm('¿Descartar los cambios y volver?')) {
      navigate(ROUTES.INSTRUCTOR_COURSES);
    }
  };

  const handleSave = async () => {
    if (!courseId || !courseData) return;
    
    try {
      setIsSaving(true);
      setError(null);
      
      await coursesService.update(Number(courseId), {
        title: formData.title,
        description: formData.description,
        level: formData.level,
        tierRequired: formData.tierRequired,
        visibility: formData.visibility,
        tags: formData.tags,
      });
      
      alert('✅ Curso actualizado exitosamente');
      navigate(ROUTES.INSTRUCTOR_COURSES);
    } catch (err: any) {
      console.error('Error saving course:', err);
      setError(err.response?.data?.message || 'Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddModule = () => {
    setEditingModuleId(null);
    setModuleTitle('');
    setModuleSummary('');
    setShowModuleModal(true);
  };

  const handleEditModule = (module: any) => {
    setEditingModuleId(module.id);
    setModuleTitle(module.title);
    setModuleSummary(module.summary || '');
    setShowModuleModal(true);
  };

  const handleCreateModule = async () => {
    if (!courseId || !moduleTitle.trim()) return;
    
    try {
      if (editingModuleId) {
        // Update existing module
        await coursesService.updateModule(editingModuleId, {
          title: moduleTitle,
          summary: moduleSummary,
        });
        alert('✅ Módulo actualizado exitosamente');
      } else {
        // Create new module
        const nextIndex = courseData?.modules?.length || 0;
        
        await coursesService.createModule(Number(courseId), {
          title: moduleTitle,
          summary: moduleSummary,
          position: nextIndex,
        });
        alert('✅ Módulo agregado exitosamente');
      }
      
      setShowModuleModal(false);
      loadCourse(); // Reload course data
    } catch (err: any) {
      console.error('Error creating/updating module:', err);
      alert(err.response?.data?.message || 'Error al procesar el módulo');
    }
  };

  const handleAddLesson = (moduleId: number) => {
    setSelectedModuleId(moduleId);
    setEditingLessonId(null);
    setLessonTitle('');
    setLessonContent('');
    setLessonDuration('');
    setLessonVideoUrl('');
    setLessonAttachments([]);
    setSelectedLessonFile(null);
    setShowLessonModal(true);
  };

  const parseLessonAttachments = (resources: unknown): LessonAttachment[] => {
    if (!resources || typeof resources !== 'object') {
      return [];
    }

    const attachments = (resources as { attachments?: unknown }).attachments;
    if (!Array.isArray(attachments)) {
      return [];
    }

    return attachments
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const file = item as Record<string, unknown>;
        return {
          name: String(file.name ?? 'Archivo'),
          url: String(file.url ?? ''),
          mimetype: file.mimetype ? String(file.mimetype) : undefined,
          size: typeof file.size === 'number' ? file.size : undefined,
          filename: file.filename ? String(file.filename) : undefined,
        };
      })
      .filter((item) => item.url);
  };

  const handleEditLesson = (moduleId: number, lesson: any) => {
    setSelectedModuleId(moduleId);
    setEditingLessonId(lesson.id);
    setLessonTitle(lesson.title);
    setLessonContent(lesson.content || '');
    setLessonDuration(lesson.durationMin?.toString() || '');
    setLessonVideoUrl(lesson.videoUrl || '');
    setLessonAttachments(parseLessonAttachments(lesson.resources));
    setSelectedLessonFile(null);
    setShowLessonModal(true);
  };

  const handleUploadLessonFile = async () => {
    if (!selectedLessonFile) {
      return;
    }

    try {
      setIsUploadingLessonFile(true);
      const uploaded = await filesService.upload(selectedLessonFile);

      setLessonAttachments((prev) => [
        ...prev,
        {
          name: uploaded.originalname,
          url: uploaded.url,
          mimetype: uploaded.mimetype,
          size: uploaded.size,
          filename: uploaded.filename,
        },
      ]);

      if (!lessonVideoUrl && uploaded.mimetype.startsWith('video/')) {
        setLessonVideoUrl(uploaded.url);
      }

      setSelectedLessonFile(null);
    } catch (err: any) {
      console.error('Error uploading file:', err);
      alert(err.response?.data?.message || 'Error al subir el archivo');
    } finally {
      setIsUploadingLessonFile(false);
    }
  };

  const handleRemoveAttachment = (url: string) => {
    setLessonAttachments((prev) => prev.filter((item) => item.url !== url));
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || Number.isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCreateLesson = async () => {
    if (!selectedModuleId || !lessonTitle.trim()) return;
    
    try {
      if (editingLessonId) {
        // Update existing lesson
        await coursesService.updateLesson(editingLessonId, {
          title: lessonTitle,
          content: lessonContent,
          durationMin: lessonDuration ? Number(lessonDuration) : undefined,
          videoUrl: lessonVideoUrl || undefined,
          resources: lessonAttachments.length > 0 ? { attachments: lessonAttachments } : undefined,
        });
        alert('✅ Lección actualizada exitosamente');
      } else {
        // Create new lesson
        const module = courseData?.modules?.find(m => m.id === selectedModuleId);
        const nextIndex = module?.lessons?.length || 0;
        
        await coursesService.createLesson(selectedModuleId, {
          title: lessonTitle,
          content: lessonContent,
          durationMin: lessonDuration ? Number(lessonDuration) : undefined,
          videoUrl: lessonVideoUrl || undefined,
          position: nextIndex,
          resources: lessonAttachments.length > 0 ? { attachments: lessonAttachments } : undefined,
        });
        alert('✅ Lección agregada exitosamente');
      }
      
      setShowLessonModal(false);
      loadCourse(); // Reload course data
    } catch (err: any) {
      console.error('Error creating/updating lesson:', err);
      alert(err.response?.data?.message || 'Error al procesar la lección');
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseId) return;
    
    if (window.confirm('¿Estás seguro de eliminar este curso? Esta acción no se puede deshacer.')) {
      try {
        await coursesService.delete(Number(courseId));
        alert('✅ Curso eliminado exitosamente');
        navigate(ROUTES.INSTRUCTOR_COURSES);
      } catch (err: any) {
        console.error('Error deleting course:', err);
        alert(err.response?.data?.message || 'Error al eliminar el curso');
      }
    }
  };

  const handleDeleteModule = async (moduleId: number) => {
    try {
      await coursesService.deleteModule(moduleId);
      alert('✅ Módulo eliminado exitosamente');
      loadCourse(); // Reload course data
    } catch (err: any) {
      console.error('Error deleting module:', err);
      alert(err.response?.data?.message || 'Error al eliminar el módulo');
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    try {
      await coursesService.deleteLesson(lessonId);
      alert('✅ Lección eliminada exitosamente');
      loadCourse(); // Reload course data
    } catch (err: any) {
      console.error('Error deleting lesson:', err);
      alert(err.response?.data?.message || 'Error al eliminar la lección');
    }
  };

  const handleToggleVisibility = () => {
    setFormData(prev => ({
      ...prev,
      visibility: prev.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC',
    }));
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
              Editar Curso
            </h1>
            <p style={{
              fontSize: isMobile ? '14px' : '18px',
              color: 'rgba(255, 255, 255, 0.7)',
            }}>
              {courseData.title}
            </p>
          </div>

          <div style={{
            display: 'flex',
            gap: isMobile ? '12px' : '15px',
            width: isMobile ? '100%' : 'auto',
          }}>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              style={{
                flex: isMobile ? 1 : 'none',
                padding: isMobile ? '12px 16px' : '14px 30px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: '1px solid white',
                borderRadius: '10px',
                fontWeight: 'bold',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: isMobile ? '14px' : '16px',
                opacity: isSaving ? 0.5 : 1,
              }}
            >
              ← Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                flex: isMobile ? 1 : 'none',
                padding: isMobile ? '12px 16px' : '14px 30px',
                backgroundColor: theme.colors.primary,
                color: theme.colors.textDark,
                border: 'none',
                borderRadius: '10px',
                fontWeight: 'bold',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: isMobile ? '14px' : '16px',
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              {isSaving ? '⏳ Guardando...' : '💾 Guardar'}
            </button>
          </div>
        </div>

        {/* Error Message */}
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

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '4px' : '10px',
          marginBottom: isMobile ? '24px' : '40px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          overflowX: isMobile ? 'auto' : 'visible',
          WebkitOverflowScrolling: 'touch',
        }}>
          {(['INFO', 'MODULES', 'SETTINGS'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: isMobile ? '1 0 auto' : 'none',
                padding: isMobile ? '12px 16px' : '12px 30px',
                backgroundColor: activeTab === tab ? 'rgba(93, 187, 70, 0.2)' : 'transparent',
                color: activeTab === tab ? theme.colors.primary : 'rgba(255, 255, 255, 0.7)',
                border: 'none',
                borderBottom: activeTab === tab ? `3px solid ${theme.colors.primary}` : 'none',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: isMobile ? '13px' : '16px',
                whiteSpace: 'nowrap',
              }}
            >
              {tab === 'INFO' ? 'Información' : tab === 'MODULES' ? 'Módulos y Lecciones' : 'Configuración'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'INFO' && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '15px',
            padding: '40px',
          }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '30px',
            }}>
              Información General
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <div>
                <label style={{
                  display: 'block',
                  color: 'white',
                  fontSize: '16px',
                  marginBottom: '10px',
                  fontWeight: 'bold',
                }}>
                  Título del Curso
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Título del curso"
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    fontSize: '16px',
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  color: 'white',
                  fontSize: '16px',
                  marginBottom: '10px',
                  fontWeight: 'bold',
                }}>
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descripción del curso"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '25px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    color: 'white',
                    fontSize: '16px',
                    marginBottom: '10px',
                    fontWeight: 'bold',
                  }}>
                    Nivel
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => handleInputChange('level', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      border: `2px solid ${theme.colors.primary}`,
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = 'rgba(93, 187, 70, 0.1)';
                      e.target.style.borderColor = theme.colors.primary;
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      e.target.style.borderColor = theme.colors.primary;
                    }}
                  >
                    <option value="BEGINNER" style={{ backgroundColor: theme.colors.background, color: 'white', padding: '10px' }}>Principiante</option>
                    <option value="INTERMEDIATE" style={{ backgroundColor: theme.colors.background, color: 'white', padding: '10px' }}>Intermedio</option>
                    <option value="ADVANCED" style={{ backgroundColor: theme.colors.background, color: 'white', padding: '10px' }}>Avanzado</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    color: 'white',
                    fontSize: '16px',
                    marginBottom: '10px',
                    fontWeight: 'bold',
                  }}>
                    Tier
                  </label>
                  <select
                    value={formData.tierRequired}
                    onChange={(e) => handleInputChange('tierRequired', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      border: `2px solid ${theme.colors.secondary}`,
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.backgroundColor = 'rgba(217, 210, 3, 0.1)';
                      e.target.style.borderColor = theme.colors.secondary;
                    }}
                    onBlur={(e) => {
                      e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      e.target.style.borderColor = theme.colors.secondary;
                    }}
                  >
                    <option value="FREE" style={{ backgroundColor: theme.colors.background, color: 'white', padding: '10px' }}>FREE</option>
                    <option value="PRO" style={{ backgroundColor: theme.colors.background, color: 'white', padding: '10px' }}>PRO</option>
                  </select>
                </div>
              </div>

              {/* Categories/Tags Section */}
              <div>
                <label style={{
                  display: 'block',
                  color: 'white',
                  fontSize: '16px',
                  marginBottom: '10px',
                  fontWeight: 'bold',
                }}>
                  Categorías / Tags
                </label>
                
                {/* Selected Tags */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                  marginBottom: '15px',
                  minHeight: '40px',
                  padding: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}>
                  {formData.tags.length > 0 ? (
                    formData.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 12px',
                          backgroundColor: theme.colors.primary,
                          color: theme.colors.textDark,
                          borderRadius: '15px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                        }}
                      >
                        {tag}
                        <button
                          onClick={() => toggleTag(tag)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: theme.colors.textDark,
                            cursor: 'pointer',
                            fontSize: '16px',
                            padding: '0',
                            lineHeight: '1',
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))
                  ) : (
                    <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
                      No hay tags seleccionados
                    </span>
                  )}
                </div>

                {/* Available Tags */}
                <div style={{
                  marginBottom: '15px',
                }}>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '14px',
                    marginBottom: '10px',
                  }}>
                    Tags disponibles (haz clic para agregar):
                  </p>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}>
                    {availableTags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.name)}
                        disabled={formData.tags.includes(tag.name)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: formData.tags.includes(tag.name)
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'rgba(255, 255, 255, 0.05)',
                          color: formData.tags.includes(tag.name)
                            ? 'rgba(255, 255, 255, 0.4)'
                            : 'white',
                          border: `1px solid ${formData.tags.includes(tag.name) ? 'rgba(255, 255, 255, 0.2)' : theme.colors.primary}`,
                          borderRadius: '15px',
                          fontSize: '13px',
                          cursor: formData.tags.includes(tag.name) ? 'not-allowed' : 'pointer',
                          fontWeight: 'bold',
                        }}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add New Tag */}
                <div style={{
                  display: 'flex',
                  gap: '10px',
                }}>
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addNewTag();
                      }
                    }}
                    placeholder="Crear nuevo tag..."
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  />
                  <button
                    onClick={addNewTag}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: theme.colors.primary,
                      color: theme.colors.textDark,
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    + Agregar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'MODULES' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px',
            }}>
              <h2 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: 'white',
              }}>
                Módulos y Lecciones
              </h2>
              <button
                onClick={handleAddModule}
                style={{
                  padding: '12px 24px',
                  backgroundColor: theme.colors.primary,
                  color: theme.colors.textDark,
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                ➕ Agregar Módulo
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {courseData.modules && courseData.modules.length > 0 ? (
                courseData.modules.map((module, moduleIndex) => (
                <div
                  key={module.id}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {/* Module Header */}
                  <div
                    style={{
                      padding: '20px 25px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    }}
                    onClick={() => toggleModule(module.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <span style={{
                        color: 'white',
                        fontSize: '20px',
                      }}>
                        {expandedModules[module.id] ? '▼' : '▶'}
                      </span>
                      <div>
                        <div style={{
                          color: theme.colors.primary,
                          fontSize: '12px',
                          fontWeight: 'bold',
                          marginBottom: '5px',
                        }}>
                          MÓDULO {moduleIndex + 1}
                        </div>
                        <div style={{
                          color: 'white',
                          fontSize: '18px',
                          fontWeight: 'bold',
                        }}>
                          {module.title}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditModule(module);
                        }}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('¿Eliminar este módulo?')) {
                            handleDeleteModule(module.id);
                          }
                        }}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: 'rgba(255, 107, 107, 0.2)',
                          color: '#ff6b6b',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Lessons List */}
                  {expandedModules[module.id] && (
                    <div style={{ padding: '20px 25px' }}>
                      {module.lessons && module.lessons.length > 0 ? (
                        module.lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lesson.id}
                          style={{
                            padding: '15px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            marginBottom: '10px',
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px',
                          }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              color: 'rgba(255, 255, 255, 0.6)',
                              fontSize: '12px',
                              marginBottom: '5px',
                            }}>
                              Lección {lessonIndex + 1}
                            </div>
                            <div style={{
                              color: 'white',
                              fontSize: '16px',
                              fontWeight: 'bold',
                            }}>
                              {lesson.title}
                            </div>
                            <div style={{
                              color: 'rgba(255, 255, 255, 0.5)',
                              fontSize: '13px',
                              marginTop: '5px',
                            }}>
                              {lesson.durationMin ? `Duración: ${lesson.durationMin} min` : 'Duración no especificada'}
                            </div>

                            {parseLessonAttachments(lesson.resources).length > 0 && (
                              <div style={{ marginTop: '10px' }}>
                                <div style={{
                                  color: theme.colors.secondary,
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  marginBottom: '6px',
                                }}>
                                  Adjuntos ({parseLessonAttachments(lesson.resources).length})
                                </div>
                                <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '4px',
                                }}>
                                  {parseLessonAttachments(lesson.resources).slice(0, 3).map((file) => (
                                    <a
                                      key={file.url}
                                      href={file.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{
                                        color: theme.colors.primary,
                                        fontSize: '12px',
                                        textDecoration: 'none',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}
                                      title={file.name}
                                    >
                                      {file.name}{file.size ? ` (${formatBytes(file.size)})` : ''}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleEditLesson(module.id, lesson)}
                              style={{
                                padding: '8px 14px',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                              }}
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('¿Eliminar lección?')) {
                                  handleDeleteLesson(lesson.id);
                                }
                              }}
                              style={{
                                padding: '8px 14px',
                                backgroundColor: 'rgba(255, 107, 107, 0.2)',
                                color: '#ff6b6b',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                          </div>
                        </div>
                      ))
                      ) : (
                        <div style={{
                          textAlign: 'center',
                          padding: '20px',
                          color: 'rgba(255, 255, 255, 0.5)',
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '8px',
                          marginBottom: '10px',
                        }}>
                          No hay lecciones en este módulo
                        </div>
                      )}

                      <button
                        onClick={() => handleAddLesson(module.id)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          backgroundColor: 'transparent',
                          color: theme.colors.primary,
                          border: `2px dashed ${theme.colors.primary}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          marginTop: '10px',
                        }}
                      >
                        ➕ Agregar Lección
                      </button>
                    </div>
                  )}
                </div>
              ))
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>📚</div>
                  <p>No hay módulos aún. Haz clic en "Agregar Módulo" para comenzar.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'SETTINGS' && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '15px',
            padding: '40px',
          }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '30px',
            }}>
              Configuración del Curso
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={formData.visibility === 'PUBLIC'}
                    onChange={handleToggleVisibility}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{
                      color: 'white',
                      fontSize: '18px',
                      fontWeight: 'bold',
                    }}>
                      Curso Público
                    </div>
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '14px',
                      marginTop: '5px',
                    }}>
                      {formData.visibility === 'PUBLIC' 
                        ? 'El curso está visible para todos los estudiantes' 
                        : 'El curso está oculto, solo tú puedes verlo'}
                    </div>
                  </div>
                </label>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: 'rgba(167, 38, 38, 0.1)',
                borderRadius: '10px',
                border: '1px solid rgba(167, 38, 38, 0.3)',
              }}>
                <h3 style={{
                  color: 'rgb(220, 38, 38)',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginBottom: '10px',
                }}>
                  ⚠️ Zona de Peligro
                </h3>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '14px',
                  marginBottom: '15px',
                }}>
                  Una vez eliminado el curso, no podrás recuperarlo. Todos los módulos, lecciones y progreso de los estudiantes se perderán permanentemente.
                </p>
                <button
                  onClick={handleDeleteCourse}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'rgb(167, 38, 38)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgb(127, 29, 29)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgb(167, 38, 38)';
                  }}
                >
                  🗑️ Eliminar Curso Permanentemente
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Add Module */}
      {showModuleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px',
        }}
        onClick={() => setShowModuleModal(false)}
        >
          <div
            style={{
              backgroundColor: theme.colors.background,
              borderRadius: '15px',
              padding: isMobile ? '30px 20px' : '40px',
              maxWidth: '600px',
              width: '100%',
              border: `2px solid ${theme.colors.primary}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontSize: isMobile ? '24px' : '28px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '25px',
            }}>
              {editingModuleId ? '✏️ Editar Módulo' : '➕ Agregar Módulo'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  color: 'white',
                  fontSize: '16px',
                  marginBottom: '10px',
                  fontWeight: 'bold',
                }}>
                  Título del Módulo *
                </label>
                <input
                  type="text"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  placeholder="Ej: Introducción al Tema"
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    border: `2px solid ${theme.colors.primary}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  color: 'white',
                  fontSize: '16px',
                  marginBottom: '10px',
                  fontWeight: 'bold',
                }}>
                  Resumen (Opcional)
                </label>
                <textarea
                  value={moduleSummary}
                  onChange={(e) => setModuleSummary(e.target.value)}
                  placeholder="Breve descripción del módulo..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                gap: '15px',
                marginTop: '10px',
              }}>
                <button
                  onClick={() => setShowModuleModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: '1px solid white',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '16px',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateModule}
                  disabled={!moduleTitle.trim()}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: moduleTitle.trim() ? theme.colors.primary : 'rgba(255, 255, 255, 0.1)',
                    color: moduleTitle.trim() ? theme.colors.textDark : 'rgba(255, 255, 255, 0.5)',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: moduleTitle.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '16px',
                  }}
                >
                  {editingModuleId ? 'Actualizar Módulo' : 'Crear Módulo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Lesson */}
      {showLessonModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px',
        }}
        onClick={() => setShowLessonModal(false)}
        >
          <div
            style={{
              backgroundColor: theme.colors.background,
              borderRadius: '15px',
              padding: isMobile ? '30px 20px' : '40px',
              maxWidth: '600px',
              width: '100%',
              border: `2px solid ${theme.colors.primary}`,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontSize: isMobile ? '24px' : '28px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '25px',
            }}>
              {editingLessonId ? '✏️ Editar Lección' : '➕ Agregar Lección'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{
                  display: 'block',
                  color: 'white',
                  fontSize: '16px',
                  marginBottom: '10px',
                  fontWeight: 'bold',
                }}>
                  Título de la Lección *
                </label>
                <input
                  type="text"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="Ej: Conceptos Básicos"
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    border: `2px solid ${theme.colors.primary}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  color: 'white',
                  fontSize: '16px',
                  marginBottom: '10px',
                  fontWeight: 'bold',
                }}>
                  Contenido (Opcional)
                </label>
                <textarea
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                  placeholder="Describe el contenido de la lección..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  color: 'white',
                  fontSize: '16px',
                  marginBottom: '10px',
                  fontWeight: 'bold',
                }}>
                  Duración (minutos)
                </label>
                <input
                  type="number"
                  value={lessonDuration}
                  onChange={(e) => setLessonDuration(e.target.value)}
                  placeholder="15"
                  min="1"
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  color: 'white',
                  fontSize: '16px',
                  marginBottom: '10px',
                  fontWeight: 'bold',
                }}>
                  URL del Video (Opcional)
                </label>
                <input
                  type="url"
                  value={lessonVideoUrl}
                  onChange={(e) => setLessonVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  color: 'white',
                  fontSize: '16px',
                  marginBottom: '10px',
                  fontWeight: 'bold',
                }}>
                  Adjuntos de la Lección
                </label>

                <div style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  marginBottom: '12px',
                  flexWrap: 'wrap',
                }}>
                  <input
                    type="file"
                    onChange={(e) => setSelectedLessonFile(e.target.files?.[0] ?? null)}
                    style={{
                      flex: 1,
                      minWidth: '220px',
                      color: 'white',
                    }}
                  />
                  <button
                    onClick={handleUploadLessonFile}
                    disabled={!selectedLessonFile || isUploadingLessonFile}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: selectedLessonFile && !isUploadingLessonFile
                        ? theme.colors.secondary
                        : 'rgba(255, 255, 255, 0.15)',
                      color: selectedLessonFile && !isUploadingLessonFile
                        ? theme.colors.textDark
                        : 'rgba(255, 255, 255, 0.6)',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: selectedLessonFile && !isUploadingLessonFile ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {isUploadingLessonFile ? 'Subiendo...' : 'Subir archivo'}
                  </button>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}>
                  {lessonAttachments.length === 0 ? (
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '13px',
                      padding: '10px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '8px',
                    }}>
                      No hay archivos adjuntos todavía.
                    </div>
                  ) : (
                    lessonAttachments.map((file) => (
                      <div
                        key={file.url}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          borderRadius: '8px',
                        }}
                      >
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: theme.colors.primary,
                            textDecoration: 'none',
                            fontSize: '13px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '400px',
                          }}
                          title={file.name}
                        >
                          {file.name}
                        </a>
                        <button
                          onClick={() => handleRemoveAttachment(file.url)}
                          style={{
                            padding: '6px 10px',
                            backgroundColor: 'rgba(255, 107, 107, 0.2)',
                            color: '#ff6b6b',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          Quitar
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '15px',
                marginTop: '10px',
              }}>
                <button
                  onClick={() => setShowLessonModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: '1px solid white',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '16px',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateLesson}
                  disabled={!lessonTitle.trim()}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: lessonTitle.trim() ? theme.colors.primary : 'rgba(255, 255, 255, 0.1)',
                    color: lessonTitle.trim() ? theme.colors.textDark : 'rgba(255, 255, 255, 0.5)',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: lessonTitle.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '16px',
                  }}
                >
                  {editingLessonId ? 'Actualizar Lección' : 'Crear Lección'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isMobile && <BottomNavigation role="INSTRUCTOR" />}
    </div>
  );
};
