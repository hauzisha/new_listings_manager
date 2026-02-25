import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import type { Notification } from '@/lib/types';

function getNotificationBorderColor(type: string): string {
  if (type === 'commission' || type === 'approved') return 'border-l-emerald-500';
  if (type === 'warning' || type === 'stale') return 'border-l-amber-500';
  return 'border-l-primary';
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string, link?: string) => void;
}) {
  const borderColor = getNotificationBorderColor(notification.type);

  return (
    <button
      onClick={() => onRead(notification.id, notification.link)}
      className={cn(
        'w-full text-left px-3 py-2.5 border-l-2 rounded-r-md transition-colors hover:bg-muted/70 cursor-pointer',
        borderColor,
        !notification.isRead ? 'bg-primary/5' : 'bg-transparent'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-foreground leading-tight">{notification.title}</p>
        {!notification.isRead && (
          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-1" />
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
        {notification.message}
      </p>
      <p className="text-[10px] text-muted-foreground/70 mt-1">
        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
      </p>
    </button>
  );
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, markRead, markAllRead } = useNotifications();

  const handleNotificationClick = (id: string, link?: string) => {
    markRead.mutate(id);
    if (link) {
      navigate(link);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full hover:bg-muted"
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[360px] p-0 shadow-xl border-border"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10 px-2"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              Mark all read
            </Button>
          )}
        </div>

        {/* Body */}
        <div className="max-h-[360px] overflow-y-auto">
          {isLoading ? (
            <div className="p-3 space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-1.5 p-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2.5 w-1/3" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center px-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
                <Bell className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
              {notifications.slice(0, 10).map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={handleNotificationClick}
                />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
