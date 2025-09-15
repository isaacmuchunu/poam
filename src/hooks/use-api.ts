import { useState, useCallback } from 'react';
import { useNotifications } from '@/lib/notifications';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  showSuccess?: boolean;
  showError?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T = any>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const { success, error: showError } = useNotifications();

  const execute = useCallback(async (
    url: string,
    options: ApiOptions = {}
  ): Promise<T | null> => {
    const {
      method = 'GET',
      body,
      showSuccess = false,
      showError: showErrorNotification = true,
      successMessage = 'Operation completed successfully',
      errorMessage = 'An error occurred',
    } = options;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const config: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (body && method !== 'GET') {
        config.body = JSON.stringify(body);
      }

      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      setState(prev => ({ ...prev, data, loading: false }));

      if (showSuccess) {
        success('Success', successMessage);
      }

      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : errorMessage;
      setState(prev => ({ ...prev, error: errorMsg, loading: false }));

      if (showErrorNotification) {
        showError('Error', errorMsg);
      }

      return null;
    }
  }, [success, showError]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Specialized hooks for common API patterns
export function useCreateApi<T = any>(baseUrl: string) {
  const api = useApi<T>();
  
  const create = useCallback((data: any) => {
    return api.execute(`${baseUrl}`, {
      method: 'POST',
      body: data,
      showSuccess: true,
      successMessage: 'Created successfully',
    });
  }, [api, baseUrl]);

  return { ...api, create };
}

export function useUpdateApi<T = any>(baseUrl: string) {
  const api = useApi<T>();
  
  const update = useCallback((id: string, data: any) => {
    return api.execute(`${baseUrl}/${id}`, {
      method: 'PUT',
      body: data,
      showSuccess: true,
      successMessage: 'Updated successfully',
    });
  }, [api, baseUrl]);

  return { ...api, update };
}

export function useDeleteApi() {
  const api = useApi();
  
  const deleteItem = useCallback((url: string) => {
    return api.execute(url, {
      method: 'DELETE',
      showSuccess: true,
      successMessage: 'Deleted successfully',
    });
  }, [api]);

  return { ...api, delete: deleteItem };
}

export function useFetchApi<T = any>(url?: string) {
  const api = useApi<T>();
  
  const fetch = useCallback((fetchUrl?: string) => {
    const targetUrl = fetchUrl || url;
    if (!targetUrl) return Promise.resolve(null);
    
    return api.execute(targetUrl, {
      method: 'GET',
      showError: true,
    });
  }, [api, url]);

  return { ...api, fetch };
}

// Hook for paginated data
export function usePaginatedApi<T = any>(baseUrl: string) {
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    hasMore: false,
  });

  const api = useApi<{ data: T[]; metadata: any }>();

  const fetchPage = useCallback(async (page: number = 1, limit: number = 10) => {
    const url = `${baseUrl}?page=${page}&limit=${limit}`;
    const result = await api.execute(url);
    
    if (result) {
      setPagination({
        page,
        limit,
        total: result.metadata?.total || 0,
        hasMore: result.metadata?.hasMore || false,
      });
    }
    
    return result;
  }, [api, baseUrl]);

  const nextPage = useCallback(() => {
    if (pagination.hasMore) {
      return fetchPage(pagination.page + 1, pagination.limit);
    }
    return Promise.resolve(null);
  }, [fetchPage, pagination]);

  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      return fetchPage(pagination.page - 1, pagination.limit);
    }
    return Promise.resolve(null);
  }, [fetchPage, pagination]);

  return {
    ...api,
    pagination,
    fetchPage,
    nextPage,
    prevPage,
  };
}
