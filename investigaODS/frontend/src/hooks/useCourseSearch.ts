import { useState, useCallback } from 'react';
import { coursesService } from '../services/api.service';
import type { Course } from '../types';
import { useApiError } from './useApiError';

export const useCourseSearch = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { error, handleError, clearError } = useApiError();

  const searchCourses = useCallback(async (searchQuery: string, tierFilter?: 'FREE' | 'PRO' | 'ALL') => {
    const normalizedQuery = searchQuery.trim();
    const hasTierFilter = !!tierFilter && tierFilter !== 'ALL';

    if (!normalizedQuery && !hasTierFilter) {
      setCourses([]);
      return;
    }

    setIsLoading(true);
    clearError();
    
    try {
      const filters: any = {};

      if (normalizedQuery) {
        filters.q = normalizedQuery;
      }
      
      if (hasTierFilter) {
        filters.tier = tierFilter;
      }

      const data = await coursesService.getAll(filters);
      setCourses(data);
    } catch (err) {
      console.error('Error searching courses:', err);
      handleError(err);
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  const clearSearch = useCallback(() => {
    setCourses([]);
    clearError();
  }, [clearError]);

  return {
    courses,
    isLoading,
    error,
    searchCourses,
    clearSearch,
  };
};
