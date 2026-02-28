import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getSessionToken } from '@/lib/session';

interface UserStatus {
  name: string;
  email: string;
  role: 'ADMIN' | 'AGENT' | 'PROMOTER';
  isApproved: boolean;
}

export function useCurrentUser() {
  const token = getSessionToken();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['user-status'],
    queryFn: () => api.get<UserStatus>('/api/auth/user-status'),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 500,
    enabled: !!token,
  });

  // If we have a token but the query errored, treat as "no session"
  // (token is stale/invalid). If still loading, keep showing spinner.
  return {
    userStatus: isError ? null : data,
    isLoading: !!token && isLoading,
  };
}
