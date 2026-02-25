import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Notification } from '@/lib/types';

export function useNotifications() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notification[]>('/api/notifications'),
    staleTime: 60 * 1000,
    retry: false,
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => api.get<{ count: number }>('/api/notifications/unread-count'),
    refetchInterval: 30 * 1000,
    staleTime: 30 * 1000,
    retry: false,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.post<void>(`/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => api.post<void>('/api/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  return {
    notifications: notifications ?? [],
    unreadCount: unreadCount?.count ?? 0,
    isLoading,
    markRead,
    markAllRead,
  };
}
