import { useState, useCallback } from 'react';
import { coursesService } from '../services/api.service';
import type { Course } from '../types';
import { useApiError } from './useApiError';

export const useCourseSearch = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { error, handleError, clearError } = useApiError();

  const searchCourses = useCallback(async (
    searchQuery: string,
    tierFilter?: 'FREE' | 'PRO' | 'ALL',
    page = 1,
    limit = 12,
  ) => {
    const normalizedQuery = searchQuery.trim();
    const hasTierFilter = !!tierFilter && tierFilter !== 'ALL';

    if (!normalizedQuery && !hasTierFilter) {
      setCourses([]);
      setTotal(0);
      setTotalPages(0);
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

      filters.page = page;
      filters.limit = limit;
      filters.sortBy = 'createdAt';
      filters.order = 'DESC';

      const data = await coursesService.search(filters);
      setCourses(data.items);
      setTotal(data.meta.total);
      setTotalPages(data.meta.totalPages);
    } catch (err) {
      console.error('Error searching courses:', err);
      handleError(err);
      setCourses([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  const clearSearch = useCallback(() => {
    setCourses([]);
    setTotal(0);
    setTotalPages(0);
    clearError();
  }, [clearError]);

  return {
    courses,
    total,
    totalPages,
    isLoading,
    error,
    searchCourses,
    clearSearch,
  };
};
