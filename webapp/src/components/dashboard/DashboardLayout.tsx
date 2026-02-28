import { useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  MessageSquare,
  DollarSign,
  BarChart3,
  Settings,
  Link2,
  Search,
  Megaphone,
  TrendingUp,
  ChevronDown,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { NotificationBell } from './NotificationBell';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSession } from '@/lib/auth-client';
import { authClient } from '@/lib/auth-client';
import { setSessionToken } from '@/lib/api';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ADMIN_NAV: NavItem[] = [
  { label: 'Overview', href: '/dashboard/admin', icon: LayoutDashboard },
  { label: 'Users', href: '/dashboard/admin/users', icon: Users },
  { label: 'Listings', href: '/dashboard/admin/listings', icon: Building2 },
  { label: 'Inquiries', href: '/dashboard/admin/inquiries', icon: MessageSquare },
  { label: 'Commissions', href: '/dashboard/admin/commissions', icon: DollarSign },
  { label: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
];

const AGENT_NAV: NavItem[] = [
  { label: 'Overview', href: '/dashboard/agent', icon: LayoutDashboard },
  { label: 'My Listings', href: '/dashboard/agent/listings', icon: Building2 },
  { label: 'Inquiries', href: '/dashboard/agent/inquiries', icon: MessageSquare },
  { label: 'Tracking Links', href: '/dashboard/agent/tracking-links', icon: Link2 },
  { label: 'Commissions', href: '/dashboard/agent/commissions', icon: DollarSign },
];

const PROMOTER_NAV: NavItem[] = [
  { label: 'Overview', href: '/dashboard/promoter', icon: LayoutDashboard },
  { label: 'Browse Properties', href: '/dashboard/promoter/listings', icon: Search },
  { label: 'My Promotions', href: '/dashboard/promoter/promotions', icon: Megaphone },
  { label: 'Tracking Links', href: '/dashboard/promoter/tracking-links', icon: Link2 },
  { label: 'Stats', href: '/dashboard/promoter/stats', icon: TrendingUp },
  { label: 'Commissions', href: '/dashboard/promoter/commissions', icon: DollarSign },
];

function getRoleBadgeClass(role: string): string {
  if (role === 'ADMIN') return 'bg-indigo-100 text-indigo-700 border-indigo-200';
  if (role === 'AGENT') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  return 'bg-amber-100 text-amber-700 border-amber-200';
}

function getRoleLabel(role: string): string {
  if (role === 'ADMIN') return 'Admin';
  if (role === 'AGENT') return 'Agent';
  return 'Promoter';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface SidebarNavItemProps {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}

function SidebarNavItem({ item, isActive, onClick }: SidebarNavItemProps) {
  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative',
        isActive
          ? 'bg-[hsl(var(--primary)/0.18)] text-[hsl(var(--sidebar-primary))]'
          : 'text-[hsl(var(--sidebar-foreground)/0.65)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]'
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[hsl(var(--sidebar-primary))] rounded-r-full" />
      )}
      <item.icon
        className={cn(
          'w-4 h-4 flex-shrink-0 transition-colors',
          isActive ? 'text-[hsl(var(--sidebar-primary))]' : 'text-[hsl(var(--sidebar-foreground)/0.65)] group-hover:text-[hsl(var(--sidebar-foreground))]'
        )}
      />
      <span>{item.label}</span>
    </Link>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session, isPending: sessionLoading } = useSession();
  const { userStatus, isLoading: userStatusLoading } = useCurrentUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoading = sessionLoading || userStatusLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-sans">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return <Navigate to="/login" replace />;
  }

  if (userStatus && !userStatus.isApproved) {
    return <Navigate to="/login" replace />;
  }

  const role = userStatus?.role ?? 'AGENT';
  const navItems =
    role === 'ADMIN' ? ADMIN_NAV : role === 'PROMOTER' ? PROMOTER_NAV : AGENT_NAV;
  const mobileNavItems = navItems.slice(0, 5);

  const handleSignOut = async () => {
    await authClient.signOut();
    setSessionToken(null);
    navigate('/login');
  };

  const isNavActive = (href: string) => {
    if (href === '/dashboard/admin' || href === '/dashboard/agent' || href === '/dashboard/promoter') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const user = session.user;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[hsl(var(--sidebar-border))]">
        <Link to={navItems[0].href} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.5)] flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-display text-white text-xl font-bold italic tracking-tight">
              Hauzisha
            </span>
            <p className="text-[10px] text-[hsl(var(--sidebar-foreground)/0.4)] mt-0.5 font-sans tracking-widest uppercase leading-none">Property Platform</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.href}
            item={item}
            isActive={isNavActive(item.href)}
            onClick={() => setMobileMenuOpen(false)}
          />
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary)/0.2)] flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-[hsl(var(--sidebar-primary))]">{getInitials(user.name ?? '')}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[hsl(var(--sidebar-foreground))] truncate leading-tight">
              {user.name}
            </p>
            <span
              className={cn(
                'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border mt-0.5',
                getRoleBadgeClass(role)
              )}
            >
              {getRoleLabel(role)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col w-60 border-r border-[hsl(var(--sidebar-border))] flex-shrink-0"
        style={{ background: 'linear-gradient(175deg, hsl(222 44% 11%) 0%, hsl(224 50% 8%) 100%)' }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            className="relative z-10 w-64 border-r border-[hsl(var(--sidebar-border))] flex flex-col h-full shadow-2xl"
            style={{ background: 'linear-gradient(175deg, hsl(222 44% 11%) 0%, hsl(224 50% 8%) 100%)' }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--sidebar-border))]">
              <span className="font-display text-white text-xl font-bold italic">Hauzisha</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
              {navItems.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  item={item}
                  isActive={isNavActive(item.href)}
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}
            </nav>
            <div className="px-4 py-4 border-t border-[hsl(var(--sidebar-border))]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[hsl(var(--primary)/0.2)] flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[hsl(var(--sidebar-primary))]">{getInitials(user.name ?? '')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[hsl(var(--sidebar-foreground))] truncate">{user.name}</p>
                  <span
                    className={cn(
                      'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border mt-0.5',
                      getRoleBadgeClass(role)
                    )}
                  >
                    {getRoleLabel(role)}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-5 md:px-6 h-[56px] border-b border-border bg-card flex-shrink-0 shadow-[0_1px_0_hsl(var(--border))]">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-4 h-4" />
            </Button>
            {title && (
              <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <NotificationBell />

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 h-9 px-2 rounded-full hover:bg-muted"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-[11px] font-bold text-primary">
                      {getInitials(user.name ?? '')}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-foreground max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="pb-2">
                  <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
                  <span
                    className={cn(
                      'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border mt-1.5',
                      getRoleBadgeClass(role)
                    )}
                  >
                    {getRoleLabel(role)}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Mobile bottom tab bar */}
        <nav
          className="md:hidden flex items-stretch border-t border-border shadow-[0_-1px_8px_rgba(0,0,0,0.06)] flex-shrink-0"
          style={{ background: 'linear-gradient(to top, hsl(0 0% 100%), hsl(218 26% 98%))' }}
        >
          {mobileNavItems.map((item) => {
            const active = isNavActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-2 gap-1 min-h-[52px] transition-colors relative',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary" />
                )}
                <span className={cn('rounded-lg px-1', active && 'bg-primary/[0.08]')}>
                  <item.icon className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
