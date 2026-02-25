import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  MessageSquare,
  DollarSign,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgentOverviewStats {
  totalListings: number;
  activeListings: number;
  totalInquiries: number;
  openInquiries: number;
  closedInquiries: number;
  totalCommissions: number;
  pendingCommissions: number;
  approvedCommissions: number;
  paidCommissions: number;
}

type InquiryStage =
  | 'INQUIRY'
  | 'WAITING_RESPONSE'
  | 'SCHEDULED'
  | 'VIEWED'
  | 'RENTED'
  | 'PURCHASED'
  | 'NO_SHOW'
  | 'CANCELLED';

interface RecentInquiry {
  id: string;
  clientName: string;
  stage: InquiryStage;
  createdAt: string;
  listing: {
    title: string;
    slug: string;
    listingNumber: number;
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

const STAGE_CONFIG: Record<InquiryStage, { label: string; className: string }> = {
  INQUIRY: { label: 'New Inquiry', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  WAITING_RESPONSE: { label: 'Awaiting Response', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  SCHEDULED: { label: 'Scheduled', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  VIEWED: { label: 'Viewed', className: 'bg-teal-100 text-teal-700 border-teal-200' },
  RENTED: { label: 'Rented', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  PURCHASED: { label: 'Purchased', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  NO_SHOW: { label: 'No Show', className: 'bg-red-100 text-red-700 border-red-200' },
  CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-600 border-gray-200' },
};

function StageBadge({ stage }: { stage: InquiryStage }) {
  const config = STAGE_CONFIG[stage] ?? { label: stage, className: 'bg-gray-100 text-gray-600 border-gray-200' };
  return (
    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', config.className)}>
      {config.label}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  topBorderClass: string;
  sublabel?: string;
}

function StatCard({ label, value, icon: Icon, iconClass, topBorderClass, sublabel }: StatCardProps) {
  return (
    <div className={cn('card-hover bg-card border border-border border-t-2 rounded-xl p-4 space-y-3', topBorderClass)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1 leading-none">{value}</p>
          {sublabel && <p className="text-[11px] text-muted-foreground mt-1">{sublabel}</p>}
        </div>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', iconClass)}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
    </div>
  );
}

// ─── Quick Link Card ──────────────────────────────────────────────────────────

function QuickLinkCard({
  label,
  description,
  href,
  icon: Icon,
  iconClass,
}: {
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
}) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(href)}
      className="card-hover bg-card border border-border rounded-xl p-4 text-left w-full group flex items-center gap-4"
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', iconClass)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0" />
    </button>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function OverviewSkeleton() {
  return (
    <div className="p-5 md:p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-3 flex items-center gap-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AgentOverview() {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['agent-overview-stats'],
    queryFn: () => api.get<AgentOverviewStats>('/api/admin/stats/agent-overview'),
  });

  const { data: recentInquiries = [], isLoading: inquiriesLoading } = useQuery({
    queryKey: ['agent-recent-inquiries'],
    queryFn: () => api.get<RecentInquiry[]>('/api/inquiries?limit=5'),
  });

  const isLoading = statsLoading || inquiriesLoading;

  if (isLoading) {
    return (
      <DashboardLayout title="Overview">
        <OverviewSkeleton />
      </DashboardLayout>
    );
  }

  const totalEarned = (stats?.approvedCommissions ?? 0) + (stats?.paidCommissions ?? 0);

  return (
    <DashboardLayout title="Overview">
      <div className="p-5 md:p-6 space-y-6">
        {/* Welcome header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Dashboard</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Here's your performance at a glance</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 border border-border rounded-lg px-3 py-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Live data
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Active Listings"
            value={stats?.activeListings ?? 0}
            sublabel={`of ${stats?.totalListings ?? 0} total`}
            icon={Building2}
            iconClass="bg-primary/10 text-primary"
            topBorderClass="border-t-primary"
          />
          <StatCard
            label="Open Inquiries"
            value={stats?.openInquiries ?? 0}
            sublabel={`${stats?.totalInquiries ?? 0} total inquiries`}
            icon={MessageSquare}
            iconClass="bg-amber-100 text-amber-600"
            topBorderClass="border-t-amber-500"
          />
          <StatCard
            label="Total Earned"
            value={formatKES(totalEarned)}
            sublabel="Approved + Paid"
            icon={DollarSign}
            iconClass="bg-emerald-100 text-emerald-600"
            topBorderClass="border-t-emerald-500"
          />
          <StatCard
            label="Pending Payout"
            value={formatKES(stats?.pendingCommissions ?? 0)}
            sublabel="Awaiting approval"
            icon={Clock}
            iconClass="bg-purple-100 text-purple-600"
            topBorderClass="border-t-purple-500"
          />
        </div>

        {/* Quick links */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Access</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <QuickLinkCard
              label="View Listings"
              description="Manage your property listings"
              href="/dashboard/agent/listings"
              icon={Building2}
              iconClass="bg-primary/10 text-primary"
            />
            <QuickLinkCard
              label="View Inquiries"
              description="Respond to client inquiries"
              href="/dashboard/agent/inquiries"
              icon={MessageSquare}
              iconClass="bg-amber-100 text-amber-600"
            />
            <QuickLinkCard
              label="View Commissions"
              description="Track your earnings"
              href="/dashboard/agent/commissions"
              icon={DollarSign}
              iconClass="bg-emerald-100 text-emerald-600"
            />
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm text-foreground">Recent Inquiries</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-primary hover:text-primary"
              onClick={() => navigate('/dashboard/agent/inquiries')}
            >
              View all
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>

          {recentInquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <MessageSquare className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No inquiries yet</p>
              <p className="text-xs text-muted-foreground mt-1">Inquiries from clients will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentInquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  className="px-5 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => navigate('/dashboard/agent/inquiries')}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-bold text-primary">
                      {inquiry.clientName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{inquiry.clientName}</p>
                    <p className="text-xs text-muted-foreground truncate">{inquiry.listing.title}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <StageBadge stage={inquiry.stage} />
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(inquiry.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stale warning if open inquiries */}
        {(stats?.openInquiries ?? 0) > 0 && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">
                {stats?.openInquiries} open {stats?.openInquiries === 1 ? 'inquiry' : 'inquiries'} need attention
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Respond promptly to stay within SLA targets and avoid stale flags.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-amber-300 text-amber-800 hover:bg-amber-100 flex-shrink-0"
              onClick={() => navigate('/dashboard/agent/inquiries')}
            >
              Respond
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
