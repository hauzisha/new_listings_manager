import { useQuery } from '@tanstack/react-query';
import { DollarSign, Clock, CheckCircle, Banknote } from 'lucide-react';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type CommissionStatus = 'PENDING' | 'APPROVED' | 'PAID';

interface Commission {
  id: string;
  amount: number;
  role: string;
  status: CommissionStatus;
  createdAt: string;
  paidAt: string | null;
  listing: {
    title: string;
    listingNumber: number;
  };
  inquiry: {
    clientName: string;
    stage: string;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatKES(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const STATUS_CONFIG: Record<CommissionStatus, { label: string; className: string; dot: string }> = {
  PENDING: { label: 'Pending', className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800', dot: 'bg-amber-500' },
  APPROVED: { label: 'Approved', className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800', dot: 'bg-blue-500' },
  PAID: { label: 'Paid', className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800', dot: 'bg-emerald-500' },
};

function StatusBadge({ status }: { status: CommissionStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border', cfg.className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
  topBorderClass,
  sublabel,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  topBorderClass: string;
  sublabel?: string;
}) {
  return (
    <div className={cn('card-hover bg-card border border-border border-t-2 rounded-xl p-4', topBorderClass)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-lg font-bold text-foreground mt-1 leading-tight">{value}</p>
          {sublabel && <p className="text-[11px] text-muted-foreground mt-0.5">{sublabel}</p>}
        </div>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', iconClass)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

// ─── Commission Row (mobile card) ─────────────────────────────────────────────

function CommissionCard({ commission }: { commission: Commission }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{commission.listing.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="font-mono text-[10px]">#{String(commission.listing.listingNumber).padStart(6, '0')}</span>
            {' · '}
            {commission.inquiry.clientName}
          </p>
        </div>
        <p className="text-base font-bold text-foreground flex-shrink-0">{formatKES(commission.amount)}</p>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusBadge status={commission.status} />
          <span className="text-[10px] font-semibold px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
            {commission.role}
          </span>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">
            {format(new Date(commission.createdAt), 'MMM d, yyyy')}
          </p>
          {commission.paidAt && (
            <p className="text-[10px] text-emerald-600 font-medium">
              Paid {format(new Date(commission.paidAt), 'MMM d, yyyy')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Desktop Table Row ────────────────────────────────────────────────────────

function TableRow({ commission }: { commission: Commission }) {
  return (
    <tr className="border-b border-border hover:bg-muted/20 transition-colors">
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{commission.listing.title}</p>
        <p className="text-[10px] font-mono text-muted-foreground">
          #{String(commission.listing.listingNumber).padStart(6, '0')}
        </p>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-foreground">{commission.inquiry.clientName}</p>
      </td>
      <td className="px-4 py-3">
        <span className="text-[11px] font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
          {commission.role}
        </span>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm font-semibold text-foreground">{formatKES(commission.amount)}</p>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={commission.status} />
      </td>
      <td className="px-4 py-3">
        <p className="text-xs text-muted-foreground">{format(new Date(commission.createdAt), 'MMM d, yyyy')}</p>
      </td>
      <td className="px-4 py-3">
        {commission.paidAt ? (
          <p className="text-xs text-emerald-600 font-medium">{format(new Date(commission.paidAt), 'MMM d, yyyy')}</p>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </td>
    </tr>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function CommissionsSkeleton() {
  return (
    <div className="p-5 md:p-6 space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-28" />
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-4">
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AgentCommissions() {
  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['agent-commissions'],
    queryFn: () => api.get<Commission[]>('/api/commissions'),
  });

  const totalEarned = commissions.reduce((sum, c) => sum + c.amount, 0);
  const pending = commissions.filter((c) => c.status === 'PENDING').reduce((sum, c) => sum + c.amount, 0);
  const approved = commissions.filter((c) => c.status === 'APPROVED').reduce((sum, c) => sum + c.amount, 0);
  const paid = commissions.filter((c) => c.status === 'PAID').reduce((sum, c) => sum + c.amount, 0);

  if (isLoading) {
    return (
      <DashboardLayout title="Commissions">
        <CommissionsSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Commissions">
      <div className="p-5 md:p-6 space-y-5">
        {/* Header */}
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">Commissions</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Track your earnings from closed deals</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total Earned"
            value={formatKES(totalEarned)}
            sublabel={`${commissions.length} commission${commissions.length !== 1 ? 's' : ''}`}
            icon={DollarSign}
            iconClass="bg-primary/10 text-primary"
            topBorderClass="border-t-primary"
          />
          <StatCard
            label="Pending"
            value={formatKES(pending)}
            sublabel={`${commissions.filter((c) => c.status === 'PENDING').length} pending`}
            icon={Clock}
            iconClass="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300"
            topBorderClass="border-t-amber-500"
          />
          <StatCard
            label="Approved"
            value={formatKES(approved)}
            sublabel={`${commissions.filter((c) => c.status === 'APPROVED').length} approved`}
            icon={CheckCircle}
            iconClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
            topBorderClass="border-t-blue-500"
          />
          <StatCard
            label="Paid Out"
            value={formatKES(paid)}
            sublabel={`${commissions.filter((c) => c.status === 'PAID').length} paid`}
            icon={Banknote}
            iconClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300"
            topBorderClass="border-t-emerald-500"
          />
        </div>

        {/* Table / card list */}
        {commissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold text-foreground mb-1">No commissions yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Commissions will appear here once deals are closed and approved.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Listing</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paid On</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((commission) => (
                    <TableRow key={commission.id} commission={commission} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {commissions.map((commission) => (
                <CommissionCard key={commission.id} commission={commission} />
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
