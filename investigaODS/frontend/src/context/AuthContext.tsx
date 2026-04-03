import React, { createContext, useState, useEffect } from 'react';
import type { User, AuthContextType, PlanCode } from '../types';
import { authService, subscriptionsService } from '../services/api.service';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

// Usuarios mock para testing (fallback si el backend no responde)
const MOCK_USERS: Record<string, { password: string; user: User; planCode: PlanCode }> = {
  // Estudiante BASIC (FREE)
  'estudiante@test.com': {
    password: '123456',
    user: {
      id: 1,
      firstName: 'Ana',
      lastName: 'García',
      email: 'estudiante@test.com',
      role: 'STUDENT',
    },
    planCode: 'BASIC',
  },
  // Estudiante PRO
  'pro@test.com': {
    password: '123456',
    user: {
      id: 2,
      firstName: 'Carlos',
      lastName: 'López',
      email: 'pro@test.com',
      role: 'STUDENT',
    },
    planCode: 'PRO',
  },
  // Instructor
  'instructor@test.com': {
    password: '123456',
    user: {
      id: 3,
      firstName: 'María',
      lastName: 'Rodríguez',
      email: 'instructor@test.com',
      role: 'INSTRUCTOR',
    },
    planCode: 'BASIC',
  },
  // Administrador
  'admin@test.com': {
    password: '123456',
    user: {
      id: 4,
      firstName: 'Luis',
      lastName: 'Martínez',
      email: 'admin@test.com',
      role: 'ADMIN',
    },
    planCode: 'BASIC',
  },
};

const USE_MOCK = false; // Cambiar a true para usar datos mock sin backend

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userPlan, setUserPlan] = useState<PlanCode>('BASIC');
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useEffect(() => {
    if (initialLoadDone) {
      return;
    }

    // Intentar cargar usuario desde localStorage y validar con backend
    const loadUser = async () => {
      const storedUser = localStorage.getItem('investiga_user');
      const storedPlan = localStorage.getItem('investiga_plan') as PlanCode | null;
      const accessToken = localStorage.getItem('accessToken');
      
      if (storedUser && accessToken && !USE_MOCK) {
        try {
          // Validar token con backend
          const validatedUser = await authService.getProfile();
          setUser(validatedUser);
          localStorage.setItem('investiga_user', JSON.stringify(validatedUser));
          
          // Obtener suscripción activa
          const subscription = await subscriptionsService.getMyActive();
          const plan = subscription?.plan?.code || 'BASIC';
          setUserPlan(plan);
          localStorage.setItem('investiga_plan', plan);
        } catch (error) {
          // Token inválido o expirado
          console.warn('Session expired or invalid:', error);
          localStorage.removeItem('investiga_user');
          localStorage.removeItem('investiga_plan');
          localStorage.removeItem('accessToken');
        }
      } else if (storedUser && USE_MOCK) {
        setUser(JSON.parse(storedUser));
        setUserPlan(storedPlan || 'BASIC');
      }
      
      setIsLoading(false);
      setInitialLoadDone(true);
    };

    loadUser();
  }, [initialLoadDone]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (USE_MOCK) {
        // Modo mock (sin backend)
        const mockUserData = MOCK_USERS[email.toLowerCase()];
        
        if (!mockUserData) {
          throw new Error('Usuario no encontrado');
        }
        
        if (mockUserData.password !== password) {
          throw new Error('Contraseña incorrecta');
        }
        
        const authenticatedUser = mockUserData.user;
        setUser(authenticatedUser);
        setUserPlan(mockUserData.planCode);
        localStorage.setItem('investiga_user', JSON.stringify(authenticatedUser));
        localStorage.setItem('investiga_plan', mockUserData.planCode);
      } else {
        // Modo real (con backend)
        const response = await authService.login({ email, password });
        
        // Guardar token y usuario
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('investiga_user', JSON.stringify(response.user));
        setUser(response.user);
        
        // Obtener suscripción activa del usuario
        try {
          const subscription = await subscriptionsService.getMyActive();
          const plan = subscription?.plan?.code || 'BASIC';
          setUserPlan(plan);
          localStorage.setItem('investiga_plan', plan);
        } catch (error) {
          console.warn('Could not fetch subscription, defaulting to BASIC:', error);
          setUserPlan('BASIC');
          localStorage.setItem('investiga_plan', 'BASIC');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (!USE_MOCK) {
        await authService.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setUserPlan('BASIC');
      localStorage.removeItem('investiga_user');
      localStorage.removeItem('investiga_plan');
      localStorage.removeItem('accessToken');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('investiga_user', JSON.stringify(updatedUser));
  };

  const value: AuthContextType = {
    user,
    userPlan,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
