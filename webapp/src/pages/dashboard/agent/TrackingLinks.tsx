import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Link2,
  Plus,
  Copy,
  Trash2,
  MousePointerClick,
  MessageSquare,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { api } from '@/lib/api';
import type { Listing } from '@/lib/types';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform =
  | 'WHATSAPP'
  | 'FACEBOOK'
  | 'INSTAGRAM'
  | 'TWITTER_X'
  | 'TIKTOK'
  | 'LINKEDIN'
  | 'EMAIL'
  | 'SMS'
  | 'WEBSITE'
  | 'OTHER';

interface TrackingLink {
  id: string;
  refCode: string;
  shareUrl: string;
  platform: Platform;
  clickCount: number;
  inquiryCount: number;
  customTag: string | null;
  targetLocation: string | null;
  createdAt: string;
  listing: {
    title: string;
    slug: string;
  };
}

// ─── Platform config ──────────────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<Platform, { label: string; className: string; iconChar: string }> = {
  WHATSAPP: { label: 'WhatsApp', className: 'bg-green-100 text-green-700 border-green-200', iconChar: 'W' },
  FACEBOOK: { label: 'Facebook', className: 'bg-blue-100 text-blue-700 border-blue-200', iconChar: 'f' },
  INSTAGRAM: { label: 'Instagram', className: 'bg-pink-100 text-pink-700 border-pink-200', iconChar: 'IG' },
  TWITTER_X: { label: 'X / Twitter', className: 'bg-gray-100 text-gray-800 border-gray-300', iconChar: 'X' },
  TIKTOK: { label: 'TikTok', className: 'bg-gray-100 text-gray-800 border-gray-300', iconChar: 'TT' },
  LINKEDIN: { label: 'LinkedIn', className: 'bg-blue-100 text-blue-800 border-blue-300', iconChar: 'in' },
  EMAIL: { label: 'Email', className: 'bg-gray-100 text-gray-600 border-gray-200', iconChar: '@' },
  SMS: { label: 'SMS', className: 'bg-gray-100 text-gray-600 border-gray-200', iconChar: 'SMS' },
  WEBSITE: { label: 'Website', className: 'bg-blue-50 text-blue-600 border-blue-200', iconChar: 'www' },
  OTHER: { label: 'Other', className: 'bg-gray-100 text-gray-500 border-gray-200', iconChar: '?' },
};

const PLATFORMS: Platform[] = [
  'WHATSAPP',
  'FACEBOOK',
  'INSTAGRAM',
  'TWITTER_X',
  'TIKTOK',
  'LINKEDIN',
  'EMAIL',
  'SMS',
  'WEBSITE',
  'OTHER',
];

function PlatformBadge({ platform }: { platform: Platform }) {
  const cfg = PLATFORM_CONFIG[platform];
  return (
    <span className={cn('inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border', cfg.className)}>
      {cfg.label}
    </span>
  );
}

// ─── Stat mini card ───────────────────────────────────────────────────────────

function MiniStat({ label, value, icon: Icon, className }: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={cn('bg-card border border-border rounded-xl px-4 py-3.5 flex items-center gap-3', className)}>
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-xl font-bold text-foreground leading-none">{value.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Create Dialog ────────────────────────────────────────────────────────────

interface CreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function CreateLinkDialog({ open, onClose, onCreated }: CreateDialogProps) {
  const [listingId, setListingId] = useState('');
  const [platform, setPlatform] = useState<Platform>('WHATSAPP');
  const [customTag, setCustomTag] = useState('');
  const [targetLocation, setTargetLocation] = useState('');

  const { data: listings = [] } = useQuery({
    queryKey: ['agent-listings-for-link'],
    queryFn: () => api.get<Listing[]>('/api/listings/agent'),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/api/tracking-links', {
        listingId,
        platform,
        customTag: customTag.trim() || undefined,
        targetLocation: targetLocation.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Tracking link created');
      setListingId('');
      setPlatform('WHATSAPP');
      setCustomTag('');
      setTargetLocation('');
      onCreated();
      onClose();
    },
    onError: () => {
      toast.error('Failed to create tracking link');
    },
  });

  const canSubmit = !!listingId && !!platform && !mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Create Tracking Link</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Listing */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Listing</label>
            <Select value={listingId} onValueChange={setListingId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a listing..." />
              </SelectTrigger>
              <SelectContent>
                {listings.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        #{String(l.listingNumber).padStart(6, '0')}
                      </span>
                      <span className="truncate max-w-[200px]">{l.title}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Platform */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Platform</label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PLATFORM_CONFIG[p].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Tag */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Custom Tag <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. summer-campaign"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              className="w-full h-9 text-sm bg-background border border-input rounded-md px-3 outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>

          {/* Target Location */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Target Location <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Nairobi, Westlands"
              value={targetLocation}
              onChange={(e) => setTargetLocation(e.target.value)}
              className="w-full h-9 text-sm bg-background border border-input rounded-md px-3 outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!canSubmit}>
            {mutation.isPending ? 'Creating...' : 'Create Link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tracking Link Row ────────────────────────────────────────────────────────

function TrackingLinkRow({
  link,
  onDelete,
}: {
  link: TrackingLink;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link.shareUrl);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <>
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <PlatformBadge platform={link.platform} />
              {link.customTag && (
                <span className="text-[10px] font-medium px-2 py-0.5 bg-muted text-muted-foreground rounded-full border border-border">
                  {link.customTag}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-foreground truncate">{link.listing.title}</p>
            {link.targetLocation && (
              <p className="text-xs text-muted-foreground mt-0.5">{link.targetLocation}</p>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 flex-shrink-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <MousePointerClick className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-semibold text-foreground">{link.clickCount.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">clicks</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-semibold text-foreground">{link.inquiryCount.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">inquiries</span>
          </div>
          <span className="text-[10px] text-muted-foreground ml-auto">
            {format(new Date(link.createdAt), 'MMM d, yyyy')}
          </span>
        </div>

        {/* URL row */}
        <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2 border border-border">
          <Globe className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />
          <span className="text-xs font-mono text-primary truncate flex-1">{link.shareUrl}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <a
            href={link.shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Confirm delete dialog */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tracking link?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the tracking link for <strong>{link.listing.title}</strong> ({PLATFORM_CONFIG[link.platform].label}). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setConfirmDelete(false);
                onDelete(link.id);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function TrackingLinksSkeleton() {
  return (
    <div className="p-5 md:p-6 space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-3">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AgentTrackingLinks() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['agent-tracking-links'],
    queryFn: () => api.get<TrackingLink[]>('/api/tracking-links'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/tracking-links/${id}`),
    onSuccess: () => {
      toast.success('Tracking link deleted');
      queryClient.invalidateQueries({ queryKey: ['agent-tracking-links'] });
    },
    onError: () => {
      toast.error('Failed to delete tracking link');
    },
  });

  const totalClicks = links.reduce((sum, l) => sum + l.clickCount, 0);
  const totalInquiries = links.reduce((sum, l) => sum + l.inquiryCount, 0);

  if (isLoading) {
    return (
      <DashboardLayout title="Tracking Links">
        <TrackingLinksSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Tracking Links">
      <div className="p-5 md:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Tracking Links</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Generate shareable links and track performance by platform</p>
          </div>
          <Button
            className="h-9 px-4 text-sm font-semibold"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Link
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <MiniStat label="Total Links" value={links.length} icon={Link2} />
          <MiniStat label="Total Clicks" value={totalClicks} icon={MousePointerClick} />
          <MiniStat label="Inquiries Generated" value={totalInquiries} icon={MessageSquare} className="col-span-2 md:col-span-1" />
        </div>

        {/* Links grid */}
        {links.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Link2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold text-foreground mb-1">No tracking links yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Create tracking links for your listings to share on social platforms and monitor performance.
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Create your first link
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {links.map((link) => (
              <TrackingLinkRow
                key={link.id}
                link={link}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <CreateLinkDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ['agent-tracking-links'] })}
      />
    </DashboardLayout>
  );
}
