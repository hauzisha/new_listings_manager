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
  Users,
  Megaphone,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  clientEmail: string | null;
  message: string | null;
  stage: InquiryStage;
  isStale: boolean;
  firstResponseAt: string | null;
  createdAt: string;
  updatedAt: string;
  listing: {
    title: string;
    slug: string;
    listingNumber: number;
  };
  stageHistory: StageHistoryEntry[];
  promoterName: string | null;
  platform: string | null;
}

type StageFilter = InquiryStage | 'ALL' | 'STALE';

// ─── Stage config ─────────────────────────────────────────────────────────────

const STAGE_CONFIG: Record<InquiryStage, { label: string; className: string; dot: string; short: string }> = {
  INQUIRY:          { label: 'Inquiry',          short: 'Inquiry',    className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',       dot: 'bg-blue-500'     },
  WAITING_RESPONSE: { label: 'Waiting Response', short: 'Waiting',    className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',     dot: 'bg-amber-500'    },
  SCHEDULED:        { label: 'Scheduled',         short: 'Scheduled',  className: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800',  dot: 'bg-violet-500'   },
  VIEWED:           { label: 'Viewed',            short: 'Viewed',     className: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800',        dot: 'bg-teal-500'     },
  RENTED:           { label: 'Rented',            short: 'Rented',     className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800', dot: 'bg-emerald-500' },
  PURCHASED:        { label: 'Purchased',         short: 'Purchased',  className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800', dot: 'bg-emerald-500' },
  NO_SHOW:          { label: 'No Show',           short: 'No Show',    className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',           dot: 'bg-red-500'      },
  CANCELLED:        { label: 'Cancelled',         short: 'Cancelled',  className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700',        dot: 'bg-gray-400'     },
};

const STAGE_PIPELINE: InquiryStage[] = [
  'INQUIRY', 'WAITING_RESPONSE', 'SCHEDULED', 'VIEWED', 'RENTED',
];

const ALL_STAGES: InquiryStage[] = [
  'INQUIRY', 'WAITING_RESPONSE', 'SCHEDULED', 'VIEWED',
  'RENTED', 'PURCHASED', 'NO_SHOW', 'CANCELLED',
];

const TERMINAL_STAGES: InquiryStage[] = ['RENTED', 'PURCHASED', 'NO_SHOW', 'CANCELLED'];

// Platform display names
const PLATFORM_LABELS: Record<string, string> = {
  WHATSAPP: 'WhatsApp',
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  TWITTER_X: 'X / Twitter',
  TIKTOK: 'TikTok',
  LINKEDIN: 'LinkedIn',
  EMAIL: 'Email',
  SMS: 'SMS',
  WEBSITE: 'Website',
  OTHER: 'Other',
};

// Stages that need a confirmation dialog before setting
const CONFIRM_STAGES: InquiryStage[] = ['RENTED', 'PURCHASED', 'CANCELLED'];

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

// ─── Platform Badge ───────────────────────────────────────────────────────────

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border">
      <Megaphone className="w-2.5 h-2.5" />
      {PLATFORM_LABELS[platform] ?? platform}
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
              isCurrent ? cfg.className : isPast ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' : 'bg-muted/40 text-muted-foreground border-transparent'
            )}>
              {isPast ? <CheckCheck className="w-3 h-3" /> : null}
              {cfg.short}
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

// ─── Confirm Stage Dialog ─────────────────────────────────────────────────────

interface ConfirmStageDialogProps {
  stage: InquiryStage;
  clientName: string;
  note: string;
  setNote: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

function ConfirmStageDialog({
  stage,
  clientName,
  note,
  setNote,
  onConfirm,
  onCancel,
  isPending,
}: ConfirmStageDialogProps) {
  const isPositive = stage === 'RENTED' || stage === 'PURCHASED';
  const icon = isPositive ? (
    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
  ) : (
    <XCircle className="w-10 h-10 text-red-500" />
  );

  const title =
    stage === 'RENTED' ? 'Confirm Rental' :
    stage === 'PURCHASED' ? 'Confirm Purchase' :
    'Cancel Inquiry';

  const message =
    stage === 'RENTED'
      ? `Mark this as rented to ${clientName}? This will automatically record commissions for all parties.`
      : stage === 'PURCHASED'
      ? `Mark this as purchased by ${clientName}? This will automatically record commissions for all parties.`
      : `Cancel this inquiry from ${clientName}? This action records a lost deal.`;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex flex-col items-center gap-3 pb-2">
            {icon}
            <DialogTitle className="text-center">{title}</DialogTitle>
          </div>
        </DialogHeader>
        <p className="text-sm text-muted-foreground text-center">{message}</p>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Note (optional)</label>
          <input
            type="text"
            placeholder="Add a note..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full h-9 text-sm bg-background border border-input rounded-md px-3 outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
            Go back
          </Button>
          <Button
            size="sm"
            variant={isPositive ? 'default' : 'destructive'}
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1"
          >
            {isPending ? 'Saving...' : isPositive ? 'Confirm' : 'Cancel inquiry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Stage Update Control ─────────────────────────────────────────────────────

function StageUpdateControl({
  inquiryId,
  currentStage,
  clientName,
  onUpdated,
}: {
  inquiryId: string;
  currentStage: InquiryStage;
  clientName: string;
  onUpdated: () => void;
}) {
  const [selectedStage, setSelectedStage] = useState<InquiryStage>(currentStage);
  const [note, setNote] = useState('');
  const [confirmStage, setConfirmStage] = useState<InquiryStage | null>(null);

  const mutation = useMutation({
    mutationFn: ({ stage, note }: { stage: InquiryStage; note?: string }) =>
      api.patch(`/api/inquiries/${inquiryId}/stage`, { stage, note: note || undefined }),
    onSuccess: () => {
      toast.success('Stage updated');
      setNote('');
      setConfirmStage(null);
      onUpdated();
    },
    onError: () => {
      toast.error('Failed to update stage');
      setConfirmStage(null);
    },
  });

  const isDirty = selectedStage !== currentStage;

  function handleUpdate() {
    if (CONFIRM_STAGES.includes(selectedStage)) {
      setConfirmStage(selectedStage);
    } else {
      mutation.mutate({ stage: selectedStage, note });
    }
  }

  return (
    <>
      {confirmStage && (
        <ConfirmStageDialog
          stage={confirmStage}
          clientName={clientName}
          note={note}
          setNote={setNote}
          onConfirm={() => mutation.mutate({ stage: confirmStage, note })}
          onCancel={() => setConfirmStage(null)}
          isPending={mutation.isPending}
        />
      )}
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
          {!CONFIRM_STAGES.includes(selectedStage) && (
            <input
              type="text"
              placeholder="Add a note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-9 flex-1 text-sm bg-background border border-input rounded-md px-3 outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          )}
          <Button
            size="sm"
            className="h-9 px-4"
            disabled={!isDirty || mutation.isPending}
            onClick={handleUpdate}
            variant={isDirty && TERMINAL_STAGES.includes(selectedStage) ? (
              selectedStage === 'RENTED' || selectedStage === 'PURCHASED' ? 'default' : 'destructive'
            ) : 'default'}
          >
            {mutation.isPending ? 'Saving...' : 'Update'}
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── Inquiry Row ──────────────────────────────────────────────────────────────

function InquiryRow({ inquiry, onUpdated }: { inquiry: Inquiry; onUpdated: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const isInPipeline = STAGE_PIPELINE.includes(inquiry.stage);

  return (
    <div className={cn(
      'bg-card border border-border rounded-xl overflow-hidden transition-all',
      inquiry.isStale && 'border-amber-300 dark:border-amber-700'
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
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800 rounded-full px-2 py-0.5">
                <AlertTriangle className="w-2.5 h-2.5" />
                Stale
              </span>
            )}
            {inquiry.platform && <PlatformBadge platform={inquiry.platform} />}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <span className="text-xs text-muted-foreground truncate">
              <span className="font-mono text-[10px]">#{String(inquiry.listing.listingNumber).padStart(6, '0')}</span>
              {' · '}
              {inquiry.listing.title}
            </span>
            {inquiry.promoterName && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap">
                <Users className="w-2.5 h-2.5 flex-shrink-0" />
                via {inquiry.promoterName}
              </span>
            )}
          </div>
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
      <div className="sm:hidden px-4 pb-3 flex items-center gap-2 flex-wrap">
        <StageBadge stage={inquiry.stage} />
        <span className="text-[10px] text-muted-foreground">
          {formatDistanceToNow(new Date(inquiry.createdAt), { addSuffix: true })}
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-4">
          {/* Pipeline — only shown for pipeline stages */}
          {isInPipeline && <StagePipeline currentStage={inquiry.stage} />}

          {/* Promoter + first response meta */}
          {(inquiry.promoterName || inquiry.firstResponseAt) && (
            <div className="flex flex-wrap gap-3">
              {inquiry.promoterName && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5 text-muted-foreground/60" />
                  <span>Referred by <span className="font-semibold text-foreground">{inquiry.promoterName}</span></span>
                </div>
              )}
              {inquiry.firstResponseAt && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
                  <span>First response <span className="font-semibold text-foreground">{formatDistanceToNow(new Date(inquiry.firstResponseAt), { addSuffix: true })}</span></span>
                </div>
              )}
            </div>
          )}

          {/* Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/70" />
              <a href={`tel:${inquiry.clientPhone}`} className="hover:text-primary transition-colors truncate">
                {inquiry.clientPhone}
              </a>
            </div>
            {inquiry.clientEmail && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/70" />
                <a href={`mailto:${inquiry.clientEmail}`} className="hover:text-primary transition-colors truncate">
                  {inquiry.clientEmail}
                </a>
              </div>
            )}
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
            clientName={inquiry.clientName}
            onUpdated={onUpdated}
          />
        </div>
      )}
    </div>
  );
}

// ─── Stage Filter Tabs ────────────────────────────────────────────────────────

interface FilterTabDef {
  label: string;
  value: StageFilter;
  dot?: string;
}

const FILTER_TABS: FilterTabDef[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Inquiry', value: 'INQUIRY', dot: 'bg-blue-500' },
  { label: 'Waiting', value: 'WAITING_RESPONSE', dot: 'bg-amber-500' },
  { label: 'Scheduled', value: 'SCHEDULED', dot: 'bg-violet-500' },
  { label: 'Viewed', value: 'VIEWED', dot: 'bg-teal-500' },
  { label: 'Rented', value: 'RENTED', dot: 'bg-emerald-500' },
  { label: 'Purchased', value: 'PURCHASED', dot: 'bg-emerald-500' },
  { label: 'No Show', value: 'NO_SHOW', dot: 'bg-red-500' },
  { label: 'Cancelled', value: 'CANCELLED', dot: 'bg-gray-400' },
  { label: 'Stale', value: 'STALE' },
];

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function InquiriesSkeleton() {
  return (
    <div className="p-5 md:p-6 space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-xl flex-shrink-0" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
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
  const [activeFilter, setActiveFilter] = useState<StageFilter>('ALL');

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['agent-inquiries'],
    queryFn: () => api.get<Inquiry[]>('/api/inquiries'),
  });

  const handleUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['agent-inquiries'] });
    queryClient.invalidateQueries({ queryKey: ['agent-overview-stats'] });
    queryClient.invalidateQueries({ queryKey: ['agent-recent-inquiries'] });
  };

  // Per-stage counts
  const stageCounts = ALL_STAGES.reduce<Record<InquiryStage, number>>((acc, stage) => {
    acc[stage] = inquiries.filter((i) => i.stage === stage).length;
    return acc;
  }, {} as Record<InquiryStage, number>);

  const staleCount = inquiries.filter((i) => i.isStale).length;

  function getCount(filter: StageFilter): number {
    if (filter === 'ALL') return inquiries.length;
    if (filter === 'STALE') return staleCount;
    return stageCounts[filter] ?? 0;
  }

  const filtered = inquiries.filter((inq) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'STALE') return inq.isStale;
    return inq.stage === activeFilter;
  });

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
            <p className="text-sm text-muted-foreground mt-0.5">{inquiries.length} total · Manage and respond to client inquiries</p>
          </div>
        </div>

        {/* Quick summary pills */}
        {inquiries.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {stageCounts['INQUIRY'] > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter('INQUIRY')}
                className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 rounded-lg px-3 py-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                <AlertCircle className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">{stageCounts['INQUIRY']} New</span>
              </button>
            )}
            {(stageCounts['WAITING_RESPONSE'] + stageCounts['SCHEDULED'] + stageCounts['VIEWED']) > 0 && (
              <div className="flex items-center gap-1.5 bg-violet-50 border border-violet-200 dark:bg-violet-900/30 dark:border-violet-800 rounded-lg px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-500" />
                <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                  {stageCounts['WAITING_RESPONSE'] + stageCounts['SCHEDULED'] + stageCounts['VIEWED']} In Progress
                </span>
              </div>
            )}
            {(stageCounts['RENTED'] + stageCounts['PURCHASED']) > 0 && (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 rounded-lg px-3 py-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  {stageCounts['RENTED'] + stageCounts['PURCHASED']} Closed Won
                </span>
              </div>
            )}
            {staleCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter('STALE')}
                className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 rounded-lg px-3 py-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
              >
                <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">{staleCount} Stale</span>
              </button>
            )}
          </div>
        )}

        {/* Filter tabs — scrollable */}
        <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0">
          <div className="flex gap-1 bg-muted/60 p-1 rounded-xl border border-border w-fit min-w-full md:min-w-0">
            {FILTER_TABS.map((tab) => {
              const count = getCount(tab.value);
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveFilter(tab.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0',
                    activeFilter === tab.value
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.dot && (
                    <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', tab.dot)} />
                  )}
                  {tab.label}
                  {count > 0 && (
                    <span className={cn(
                      'text-[10px] font-bold min-w-[16px] text-center',
                      activeFilter === tab.value ? 'text-muted-foreground' : 'text-muted-foreground/60'
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Inquiry list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold text-foreground mb-1">
              {activeFilter === 'ALL' ? 'No inquiries yet' : `No ${activeFilter.toLowerCase().replace('_', ' ')} inquiries`}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {activeFilter === 'ALL'
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
