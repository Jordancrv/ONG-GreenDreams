import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { theme } from '../styles/theme';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { BottomNavigation } from '../components/mobile';
import { AppHeader } from '../components/AppHeader';
import { HelpButton } from '../components/HelpButton';
import { useAuth } from '../hooks/useAuth';
import { filesService, usersService } from '../services/api.service';

export const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const { user, updateUser } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

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

  // Load user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Password validation (only if trying to change password)
    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Ingresa tu contraseña actual';
      }
      
      if (formData.newPassword && formData.newPassword.length < 6) {
        newErrors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
      }

      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      };

      // Only include password if user is changing it
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.password = formData.newPassword;
      }

      const updatedUser = await usersService.updateProfile(updateData);
      
      // Update user in context
      if (updateUser) {
        updateUser(updatedUser);
      }

      setSuccessMessage('Perfil actualizado exitosamente');
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/profile');
      }, 2000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.message || 'Error al actualizar el perfil';
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarUpload = async () => {
    if (!selectedAvatarFile) {
      setErrors((prev) => ({ ...prev, submit: 'Selecciona una imagen para subir.' }));
      return;
    }

    setIsUploadingAvatar(true);
    setErrors((prev) => ({ ...prev, submit: '' }));
    setSuccessMessage('');

    try {
      const uploaded = await filesService.upload(selectedAvatarFile);
      const updatedUser = await usersService.updateProfile({ avatarUrl: uploaded.url });

      if (updateUser) {
        updateUser(updatedUser);
      }

      setSelectedAvatarFile(null);
      setSuccessMessage('Foto de perfil actualizada exitosamente.');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      const errorMessage = error.response?.data?.message || 'Error al subir la foto de perfil';
      setErrors((prev) => ({ ...prev, submit: errorMessage }));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

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
        maxWidth: '600px',
        margin: '0 auto',
        boxSizing: 'border-box',
        width: '100%',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '32px',
          gap: '16px',
        }}>
          <button
            onClick={() => navigate('/profile')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.colors.textPrimary,
            }}
            aria-label="Volver"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 style={{
            fontSize: isMobile ? theme.typography.fontSize['2xl'] : theme.typography.fontSize['3xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.textPrimary,
            margin: 0,
          }}>
            Editar Perfil
          </h2>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: theme.borderRadius.md,
            marginBottom: '24px',
          }}>
            <p style={{
              margin: 0,
              color: '#22c55e',
              fontSize: theme.typography.fontSize.base,
            }}>
              {successMessage}
            </p>
          </div>
        )}

        {/* Error Message */}
        {errors.submit && (
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: theme.borderRadius.md,
            marginBottom: '24px',
          }}>
            <p style={{
              margin: 0,
              color: '#ef4444',
              fontSize: theme.typography.fontSize.base,
            }}>
              {errors.submit}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Avatar Section */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.textPrimary,
              marginBottom: '16px',
            }}>
              Foto de Perfil
            </h3>

            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '16px',
              alignItems: isMobile ? 'stretch' : 'center',
              padding: '16px',
              backgroundColor: theme.colors.card,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
            }}>
              <img
                src={avatarSrc || avatarFallback}
                alt="Foto de perfil"
                onError={(e) => {
                  e.currentTarget.src = avatarFallback;
                }}
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `2px solid ${theme.colors.border}`,
                }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedAvatarFile(e.target.files?.[0] ?? null)}
                  style={{
                    width: '100%',
                    marginBottom: '10px',
                    color: theme.colors.textPrimary,
                  }}
                />

                <button
                  type="button"
                  onClick={handleAvatarUpload}
                  disabled={!selectedAvatarFile || isUploadingAvatar}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: selectedAvatarFile && !isUploadingAvatar
                      ? theme.colors.primary
                      : theme.colors.border,
                    color: selectedAvatarFile && !isUploadingAvatar
                      ? 'white'
                      : theme.colors.textSecondary,
                    border: 'none',
                    borderRadius: theme.borderRadius.md,
                    cursor: selectedAvatarFile && !isUploadingAvatar ? 'pointer' : 'not-allowed',
                    fontWeight: theme.typography.fontWeight.semibold,
                  }}
                >
                  {isUploadingAvatar ? 'Subiendo...' : 'Actualizar foto'}
                </button>
              </div>
            </div>
          </div>

          {/* Personal Information Section */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.textPrimary,
              marginBottom: '16px',
            }}>
              Información Personal
            </h3>

            {/* First Name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                fontWeight: theme.typography.fontWeight.medium,
              }}>
                Nombre(s) *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: theme.colors.card,
                  border: `1px solid ${errors.firstName ? '#ef4444' : theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.textPrimary,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
              {errors.firstName && (
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: theme.typography.fontSize.sm,
                  color: '#ef4444',
                }}>
                  {errors.firstName}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                fontWeight: theme.typography.fontWeight.medium,
              }}>
                Apellidos *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: theme.colors.card,
                  border: `1px solid ${errors.lastName ? '#ef4444' : theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.textPrimary,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
              {errors.lastName && (
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: theme.typography.fontSize.sm,
                  color: '#ef4444',
                }}>
                  {errors.lastName}
                </p>
              )}
            </div>

            {/* Email */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                fontWeight: theme.typography.fontWeight.medium,
              }}>
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: theme.colors.card,
                  border: `1px solid ${errors.email ? '#ef4444' : theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.textPrimary,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
              {errors.email && (
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: theme.typography.fontSize.sm,
                  color: '#ef4444',
                }}>
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          {/* Password Section */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.textPrimary,
              marginBottom: '8px',
            }}>
              Cambiar Contraseña
            </h3>
            <p style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.textSecondary,
              marginBottom: '16px',
            }}>
              Deja estos campos vacíos si no deseas cambiar tu contraseña
            </p>

            {/* Current Password */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                fontWeight: theme.typography.fontWeight.medium,
              }}>
                Contraseña Actual
              </label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: theme.colors.card,
                  border: `1px solid ${errors.currentPassword ? '#ef4444' : theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.textPrimary,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
              {errors.currentPassword && (
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: theme.typography.fontSize.sm,
                  color: '#ef4444',
                }}>
                  {errors.currentPassword}
                </p>
              )}
            </div>

            {/* New Password */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                fontWeight: theme.typography.fontWeight.medium,
              }}>
                Nueva Contraseña
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: theme.colors.card,
                  border: `1px solid ${errors.newPassword ? '#ef4444' : theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.textPrimary,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
              {errors.newPassword && (
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: theme.typography.fontSize.sm,
                  color: '#ef4444',
                }}>
                  {errors.newPassword}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.textSecondary,
                fontWeight: theme.typography.fontWeight.medium,
              }}>
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: theme.colors.card,
                  border: `1px solid ${errors.confirmPassword ? '#ef4444' : theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.textPrimary,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
              {errors.confirmPassword && (
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: theme.typography.fontSize.sm,
                  color: '#ef4444',
                }}>
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '16px',
            marginTop: '32px',
          }}>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: 'transparent',
                color: theme.colors.textPrimary,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.5 : 1,
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '14px',
                backgroundColor: theme.colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.base,
                fontWeight: theme.typography.fontWeight.semibold,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.opacity = '0.9';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.opacity = '1';
                }
              }}
            >
              <Save size={20} />
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>

        {isMobile && <div style={{ height: '20px' }} />}
      </main>

      {/* Bottom Navigation */}
      {isMobile && <BottomNavigation role={userRole} />}

      {/* Help Button */}
      <HelpButton show={user?.role === 'STUDENT'} />
    </div>
  );
};
