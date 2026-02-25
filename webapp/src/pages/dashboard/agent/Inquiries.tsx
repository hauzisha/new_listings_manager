import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Phone,
  Mail,
  CheckCheck,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type InquiryStage =
  | 'INQUIRY'
  | 'WAITING_RESPONSE'
  | 'SCHEDULED'
  | 'VIEWED'
  | 'RENTED'
  | 'PURCHASED'
  | 'NO_SHOW'
  | 'CANCELLED';

interface StageHistoryEntry {
  id: string;
  fromStage: InquiryStage | null;
  toStage: InquiryStage;
  note: string | null;
  createdAt: string;
}

interface Inquiry {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  message: string;
  stage: InquiryStage;
  isStale: boolean;
  createdAt: string;
  updatedAt: string;
  listing: {
    title: string;
    slug: string;
    listingNumber: number;
  };
  stageHistory: StageHistoryEntry[];
}

type FilterTab = 'all' | 'open' | 'scheduled' | 'closed' | 'stale';

// ─── Stage config ─────────────────────────────────────────────────────────────

const STAGE_CONFIG: Record<InquiryStage, { label: string; className: string; dot: string }> = {
  INQUIRY: { label: 'Inquiry', className: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  WAITING_RESPONSE: { label: 'Waiting Response', className: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  SCHEDULED: { label: 'Scheduled', className: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  VIEWED: { label: 'Viewed', className: 'bg-teal-100 text-teal-700 border-teal-200', dot: 'bg-teal-500' },
  RENTED: { label: 'Rented', className: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  PURCHASED: { label: 'Purchased', className: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  NO_SHOW: { label: 'No Show', className: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
};

const STAGE_PIPELINE: InquiryStage[] = [
  'INQUIRY',
  'WAITING_RESPONSE',
  'SCHEDULED',
  'VIEWED',
  'RENTED',
];

const ALL_STAGES: InquiryStage[] = [
  'INQUIRY',
  'WAITING_RESPONSE',
  'SCHEDULED',
  'VIEWED',
  'RENTED',
  'PURCHASED',
  'NO_SHOW',
  'CANCELLED',
];

function isOpenStage(stage: InquiryStage): boolean {
  return stage === 'INQUIRY' || stage === 'WAITING_RESPONSE';
}
function isScheduledStage(stage: InquiryStage): boolean {
  return stage === 'SCHEDULED' || stage === 'VIEWED';
}
function isClosedStage(stage: InquiryStage): boolean {
  return stage === 'RENTED' || stage === 'PURCHASED' || stage === 'NO_SHOW' || stage === 'CANCELLED';
}

// ─── Stage Badge ──────────────────────────────────────────────────────────────

function StageBadge({ stage }: { stage: InquiryStage }) {
  const cfg = STAGE_CONFIG[stage];
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border', cfg.className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ─── Stage Pipeline ───────────────────────────────────────────────────────────

function StagePipeline({ currentStage }: { currentStage: InquiryStage }) {
  const currentIdx = STAGE_PIPELINE.indexOf(currentStage);
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {STAGE_PIPELINE.map((stage, i) => {
        const isPast = currentIdx > i;
        const isCurrent = currentIdx === i;
        const cfg = STAGE_CONFIG[stage];
        return (
          <div key={stage} className="flex items-center">
            <div className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border whitespace-nowrap',
              isCurrent ? cfg.className : isPast ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-muted/40 text-muted-foreground border-transparent'
            )}>
              {isPast ? <CheckCheck className="w-3 h-3" /> : null}
              {cfg.label}
            </div>
            {i < STAGE_PIPELINE.length - 1 && (
              <ChevronRight className="w-3 h-3 text-muted-foreground/40 flex-shrink-0 mx-0.5" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Stage History Timeline ───────────────────────────────────────────────────

function StageTimeline({ history }: { history: StageHistoryEntry[] }) {
  if (history.length === 0) return null;
  const sorted = [...history].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stage History</p>
      <div className="relative pl-4 space-y-3">
        <div className="absolute left-1.5 top-1.5 bottom-1.5 w-px bg-border" />
        {sorted.map((entry) => {
          const cfg = STAGE_CONFIG[entry.toStage];
          return (
            <div key={entry.id} className="relative pl-4">
              <div className={cn('absolute left-[-6px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-background', cfg.dot)} />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {entry.fromStage && (
                      <>
                        <span className="text-xs text-muted-foreground">{STAGE_CONFIG[entry.fromStage]?.label ?? entry.fromStage}</span>
                        <ChevronRight className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
                      </>
                    )}
                    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full border', cfg.className)}>
                      {cfg.label}
                    </span>
                  </div>
                  {entry.note && (
                    <p className="text-xs text-muted-foreground mt-0.5 italic">"{entry.note}"</p>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                  {format(new Date(entry.createdAt), 'MMM d, HH:mm')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Stage Update Control ─────────────────────────────────────────────────────

function StageUpdateControl({
  inquiryId,
  currentStage,
  onUpdated,
}: {
  inquiryId: string;
  currentStage: InquiryStage;
  onUpdated: () => void;
}) {
  const [selectedStage, setSelectedStage] = useState<InquiryStage>(currentStage);
  const [note, setNote] = useState('');

  const mutation = useMutation({
    mutationFn: ({ stage, note }: { stage: InquiryStage; note?: string }) =>
      api.patch(`/api/inquiries/${inquiryId}/stage`, { stage, note: note || undefined }),
    onSuccess: () => {
      toast.success('Stage updated');
      setNote('');
      onUpdated();
    },
    onError: () => {
      toast.error('Failed to update stage');
    },
  });

  const isDirty = selectedStage !== currentStage;

  return (
    <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Update Stage</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={selectedStage} onValueChange={(v) => setSelectedStage(v as InquiryStage)}>
          <SelectTrigger className="h-9 text-sm flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALL_STAGES.map((stage) => (
              <SelectItem key={stage} value={stage}>
                <span className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', STAGE_CONFIG[stage].dot)} />
                  {STAGE_CONFIG[stage].label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          type="text"
          placeholder="Add a note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="h-9 flex-1 text-sm bg-background border border-input rounded-md px-3 outline-none focus:ring-2 focus:ring-ring transition-all"
        />
        <Button
          size="sm"
          className="h-9 px-4"
          disabled={!isDirty || mutation.isPending}
          onClick={() => mutation.mutate({ stage: selectedStage, note })}
        >
          {mutation.isPending ? 'Saving...' : 'Update'}
        </Button>
      </div>
    </div>
  );
}

// ─── Inquiry Row ──────────────────────────────────────────────────────────────

function InquiryRow({ inquiry, onUpdated }: { inquiry: Inquiry; onUpdated: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn(
      'bg-card border border-border rounded-xl overflow-hidden transition-all',
      inquiry.isStale && 'border-amber-300'
    )}>
      {/* Summary row */}
      <button
        type="button"
        className="w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-[11px] font-bold text-primary">
            {inquiry.clientName.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Client + listing */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{inquiry.clientName}</span>
            {inquiry.isStale && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5">
                <AlertTriangle className="w-2.5 h-2.5" />
                Stale
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            <span className="font-mono text-[10px]">#{String(inquiry.listing.listingNumber).padStart(6, '0')}</span>
            {' · '}
            {inquiry.listing.title}
          </p>
        </div>

        {/* Stage + time */}
        <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
          <StageBadge stage={inquiry.stage} />
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(inquiry.createdAt), { addSuffix: true })}
          </span>
        </div>

        {/* Expand */}
        <div className="flex-shrink-0 ml-1">
          {expanded
            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Mobile stage */}
      <div className="sm:hidden px-4 pb-3 flex items-center gap-2">
        <StageBadge stage={inquiry.stage} />
        <span className="text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(inquiry.createdAt), { addSuffix: true })}
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-4">
          {/* Pipeline */}
          <StagePipeline currentStage={inquiry.stage} />

          {/* Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/70" />
              <a href={`tel:${inquiry.clientPhone}`} className="hover:text-primary transition-colors truncate">
                {inquiry.clientPhone}
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/70" />
              <a href={`mailto:${inquiry.clientEmail}`} className="hover:text-primary transition-colors truncate">
                {inquiry.clientEmail}
              </a>
            </div>
          </div>

          {/* Message */}
          {inquiry.message && (
            <div className="bg-muted/40 rounded-lg px-4 py-3 border border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Message</p>
              <p className="text-sm text-foreground leading-relaxed">{inquiry.message}</p>
            </div>
          )}

          {/* Timeline */}
          <StageTimeline history={inquiry.stageHistory} />

          {/* Update stage */}
          <StageUpdateControl
            inquiryId={inquiry.id}
            currentStage={inquiry.stage}
            onUpdated={onUpdated}
          />
        </div>
      )}
    </div>
  );
}

// ─── Filter Tabs ──────────────────────────────────────────────────────────────

const FILTER_TABS: { label: string; value: FilterTab }[] = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Closed', value: 'closed' },
  { label: 'Stale', value: 'stale' },
];

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function InquiriesSkeleton() {
  return (
    <div className="p-5 md:p-6 space-y-5">
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-xl" />
        ))}
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-16 rounded-lg" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AgentInquiries() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['agent-inquiries'],
    queryFn: () => api.get<Inquiry[]>('/api/inquiries'),
  });

  const handleUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['agent-inquiries'] });
    queryClient.invalidateQueries({ queryKey: ['agent-overview-stats'] });
    queryClient.invalidateQueries({ queryKey: ['agent-recent-inquiries'] });
  };

  const filtered = inquiries.filter((inq) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'open') return isOpenStage(inq.stage);
    if (activeTab === 'scheduled') return isScheduledStage(inq.stage);
    if (activeTab === 'closed') return isClosedStage(inq.stage);
    if (activeTab === 'stale') return inq.isStale;
    return true;
  });

  const openCount = inquiries.filter((i) => isOpenStage(i.stage)).length;
  const scheduledCount = inquiries.filter((i) => isScheduledStage(i.stage)).length;
  const closedCount = inquiries.filter((i) => isClosedStage(i.stage)).length;
  const staleCount = inquiries.filter((i) => i.isStale).length;

  if (isLoading) {
    return (
      <DashboardLayout title="Inquiries">
        <InquiriesSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Inquiries">
      <div className="p-5 md:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Inquiries</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Manage and respond to client inquiries</p>
          </div>
        </div>

        {/* Summary counts */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs font-semibold text-blue-700">{openCount} Open</span>
          </div>
          <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 rounded-lg px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-xs font-semibold text-purple-700">{scheduledCount} Scheduled</span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700">{closedCount} Closed</span>
          </div>
          {staleCount > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span className="text-xs font-semibold text-amber-700">{staleCount} Stale</span>
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-muted/60 p-1 rounded-xl border border-border w-fit flex-wrap">
          {FILTER_TABS.map((tab) => {
            const count =
              tab.value === 'open' ? openCount
              : tab.value === 'scheduled' ? scheduledCount
              : tab.value === 'closed' ? closedCount
              : tab.value === 'stale' ? staleCount
              : inquiries.length;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5',
                  activeTab === tab.value
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className={cn(
                    'text-[10px] font-bold min-w-[16px] text-center',
                    activeTab === tab.value ? 'text-muted-foreground' : 'text-muted-foreground/60'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Inquiry list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold text-foreground mb-1">
              {activeTab === 'all' ? 'No inquiries yet' : `No ${activeTab} inquiries`}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {activeTab === 'all'
                ? "When clients submit inquiries on your listings, they'll appear here."
                : 'No inquiries match this filter right now.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((inquiry) => (
              <InquiryRow
                key={inquiry.id}
                inquiry={inquiry}
                onUpdated={handleUpdated}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
