import { useState, useEffect, useCallback } from 'react';
import { tagsService } from '../services/api.service';
import type { Tag } from '../types';
import { useApiError } from './useApiError';

export const useTags = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { error, handleError, clearError } = useApiError();

  const fetchTags = useCallback(async (page = 1, limit = 16) => {
    setIsLoading(true);
    clearError();
    
    try {
      const data = await tagsService.getPaginated({ page, limit });
      setTags(data.items);
      setCurrentPage(data.meta.page);
      setTotal(data.meta.total);
      setTotalPages(data.meta.totalPages);
    } catch (err) {
      console.error('Error fetching tags:', err);
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [handleError, clearError]);

  useEffect(() => {
    fetchTags(1, 16);
  }, [fetchTags]);

  const goToPage = useCallback((page: number) => {
    if (page < 1 || (totalPages > 0 && page > totalPages)) {
      return;
    }
    fetchTags(page, 16);
  }, [fetchTags, totalPages]);

  return {
    tags,
    currentPage,
    total,
    totalPages,
    hasPreviousPage: currentPage > 1,
    hasNextPage: totalPages > 0 && currentPage < totalPages,
    isLoading,
    error,
    refetch: () => fetchTags(currentPage, 16),
    goToPage,
  };
};
