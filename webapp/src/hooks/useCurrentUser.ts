import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { isLoggedIn, setLoggedIn } from '@/lib/session';

interface UserStatus {
  name: string;
  email: string;
  role: 'ADMIN' | 'AGENT' | 'PROMOTER';
  isApproved: boolean;
}

export function useCurrentUser() {
  const flaggedIn = isLoggedIn();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['user-status'],
    queryFn: () => api.get<UserStatus>('/api/auth/user-status'),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: flaggedIn,
  });

  // Cookie session expired — clear the flag so we stop trying
  if (isError && flaggedIn) {
    setLoggedIn(false);
  }

  return {
    userStatus: isError ? null : data,
    isLoading: flaggedIn && isLoading,
  };
}
