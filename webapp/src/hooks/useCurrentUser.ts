import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface UserStatus {
  role: 'ADMIN' | 'AGENT' | 'PROMOTER';
  isApproved: boolean;
}

export function useCurrentUser() {
  const { data, isLoading } = useQuery({
    queryKey: ['user-status'],
    queryFn: () => api.get<UserStatus>('/api/auth/user-status'),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return { userStatus: data, isLoading };
}
