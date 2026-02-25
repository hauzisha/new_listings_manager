import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Users as UsersIcon } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | 'pending' | 'agents' | 'promoters' | 'admins';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function RoleBadge({ role }: { role: User['role'] }) {
  const classes =
    role === 'ADMIN'
      ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
      : role === 'AGENT'
      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
      : 'bg-amber-100 text-amber-700 border-amber-200';
  const label = role === 'ADMIN' ? 'Admin' : role === 'AGENT' ? 'Agent' : 'Promoter';
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border', classes)}>
      {label}
    </span>
  );
}

function StatusBadge({ isApproved }: { isApproved: boolean }) {
  return isApproved ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border bg-emerald-100 text-emerald-700 border-emerald-200">
      Approved
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border bg-amber-100 text-amber-700 border-amber-200">
      Pending
    </span>
  );
}

interface PendingCardProps {
  user: User;
  onApprove: (id: string) => void;
  onReject: (user: User) => void;
  approvingId: string | null;
}

function PendingUserCard({ user, onApprove, onReject, approvingId }: PendingCardProps) {
  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary">{getInitials(user.name)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-foreground">{user.name}</p>
              <RoleBadge role={user.role} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
            {user.phone && (
              <p className="text-xs text-muted-foreground">{user.phone}</p>
            )}
            <p className="text-[11px] text-muted-foreground/70 mt-1">
              Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              onClick={() => onApprove(user.id)}
              disabled={approvingId === user.id}
            >
              {approvingId === user.id ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
              <span className="ml-1.5">Approve</span>
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-8 px-3 text-xs"
              onClick={() => onReject(user)}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span className="ml-1.5">Reject</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UserTableRow({
  user,
  onApprove,
  onReject,
  approvingId,
}: {
  user: User;
  onApprove: (id: string) => void;
  onReject: (user: User) => void;
  approvingId: string | null;
}) {
  return (
    <TableRow className="hover:bg-muted/40 transition-colors">
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-bold text-primary">{getInitials(user.name)}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {user.phone ?? <span className="text-muted-foreground/40">—</span>}
      </TableCell>
      <TableCell>
        <RoleBadge role={user.role} />
      </TableCell>
      <TableCell>
        <StatusBadge isApproved={user.isApproved} />
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {user.referrer ? user.referrer.name : <span className="text-muted-foreground/40">—</span>}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {format(new Date(user.createdAt), 'MMM d, yyyy')}
      </TableCell>
      <TableCell>
        {!user.isApproved && (
          <div className="flex gap-1.5">
            <Button
              size="sm"
              className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              onClick={() => onApprove(user.id)}
              disabled={approvingId === user.id}
            >
              {approvingId === user.id ? (
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Approve'
              )}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 px-2 text-xs"
              onClick={() => onReject(user)}
            >
              Reject
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [rejectTarget, setRejectTarget] = useState<User | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const filterParam =
    activeTab === 'agents'
      ? 'agents'
      : activeTab === 'promoters'
      ? 'promoters'
      : activeTab === 'admins'
      ? 'admins'
      : activeTab === 'pending'
      ? 'pending'
      : 'all';

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', filterParam],
    queryFn: () => api.get<User[]>(`/api/admin/users?filter=${filterParam}`),
  });

  const pendingUsers = (users ?? []).filter((u) => !u.isApproved);

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post<void>(`/api/admin/users/${id}/approve`),
    onMutate: (id: string) => setApprovingId(id),
    onSuccess: (_data, id) => {
      toast.success('User approved successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setApprovingId(null);
    },
    onError: () => {
      toast.error('Failed to approve user');
      setApprovingId(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.post<void>(`/api/admin/users/${id}/reject`),
    onMutate: (id: string) => setRejectingId(id),
    onSuccess: () => {
      toast.success('User rejected and removed');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setRejectTarget(null);
      setRejectingId(null);
    },
    onError: () => {
      toast.error('Failed to reject user');
      setRejectingId(null);
    },
  });

  const handleApprove = (id: string) => approveMutation.mutate(id);
  const handleReject = (user: User) => setRejectTarget(user);
  const confirmReject = () => {
    if (rejectTarget) rejectMutation.mutate(rejectTarget.id);
  };

  return (
    <DashboardLayout title="User Management">
      <div className="p-5 md:p-6 space-y-6">
        {/* Pending Approvals Section */}
        {pendingUsers.length > 0 && activeTab === 'all' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-semibold text-foreground">
                Pending Approvals
              </h2>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold">
                {pendingUsers.length}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {pendingUsers.map((user) => (
                <PendingUserCard
                  key={user.id}
                  user={user}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  approvingId={approvingId}
                />
              ))}
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="space-y-3">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
            <TabsList className="h-9">
              <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs px-3">Pending</TabsTrigger>
              <TabsTrigger value="agents" className="text-xs px-3">Agents</TabsTrigger>
              <TabsTrigger value="promoters" className="text-xs px-3">Promoters</TabsTrigger>
              <TabsTrigger value="admins" className="text-xs px-3">Admins</TabsTrigger>
            </TabsList>

            {(['all', 'pending', 'agents', 'promoters', 'admins'] as FilterTab[]).map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-4">
                <Card className="border-border">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-border">
                          <TableHead className="text-xs font-semibold">Name / Email</TableHead>
                          <TableHead className="text-xs font-semibold">Phone</TableHead>
                          <TableHead className="text-xs font-semibold">Role</TableHead>
                          <TableHead className="text-xs font-semibold">Status</TableHead>
                          <TableHead className="text-xs font-semibold">Referred By</TableHead>
                          <TableHead className="text-xs font-semibold">Joined</TableHead>
                          <TableHead className="text-xs font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading
                          ? Array.from({ length: 5 }).map((_, i) => (
                              <TableRow key={i}>
                                {Array.from({ length: 7 }).map((__, j) => (
                                  <TableCell key={j}>
                                    <Skeleton className="h-4 w-20" />
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))
                          : (users ?? []).length === 0
                          ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-12">
                                  <div className="flex flex-col items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                      <UsersIcon className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">No users found</p>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          : (users ?? []).map((user) => (
                              <UserTableRow
                                key={user.id}
                                user={user}
                                onApprove={handleApprove}
                                onReject={handleReject}
                                approvingId={approvingId}
                              />
                            ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject user?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject{' '}
              <span className="font-semibold text-foreground">{rejectTarget?.name}</span>? Their
              account will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReject}
              className="bg-destructive hover:bg-destructive/90"
              disabled={rejectingId !== null}
            >
              {rejectingId ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : null}
              Reject & Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
