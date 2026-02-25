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
  CheckCheck,
  ArrowUpRight,
  Tag,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
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

const PLATFORM_CONFIG: Record<Platform, { label: string; className: string }> = {
  WHATSAPP:  { label: 'WhatsApp',   className: 'bg-green-100 text-green-700 border-green-200'     },
  FACEBOOK:  { label: 'Facebook',   className: 'bg-blue-100 text-blue-700 border-blue-200'        },
  INSTAGRAM: { label: 'Instagram',  className: 'bg-pink-100 text-pink-700 border-pink-200'        },
  TWITTER_X: { label: 'X / Twitter',className: 'bg-gray-100 text-gray-800 border-gray-300'       },
  TIKTOK:    { label: 'TikTok',     className: 'bg-gray-100 text-gray-800 border-gray-300'       },
  LINKEDIN:  { label: 'LinkedIn',   className: 'bg-blue-100 text-blue-800 border-blue-300'       },
  EMAIL:     { label: 'Email',      className: 'bg-gray-100 text-gray-600 border-gray-200'       },
  SMS:       { label: 'SMS',        className: 'bg-gray-100 text-gray-600 border-gray-200'       },
  WEBSITE:   { label: 'Website',    className: 'bg-blue-50 text-blue-600 border-blue-200'        },
  OTHER:     { label: 'Other',      className: 'bg-gray-100 text-gray-500 border-gray-200'       },
};

const PLATFORMS: Platform[] = [
  'WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'TWITTER_X', 'TIKTOK',
  'LINKEDIN', 'EMAIL', 'SMS', 'WEBSITE', 'OTHER',
];

function PlatformBadge({ platform }: { platform: Platform }) {
  const cfg = PLATFORM_CONFIG[platform];
  return (
    <span className={cn('inline-flex items-center text-[11px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap', cfg.className)}>
      {cfg.label}
    </span>
  );
}

// ─── Copy Button (with 3-second "Copied!" state) ──────────────────────────────

function CopyButton({ url, size = 'md' }: { url: string; size?: 'sm' | 'md' }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard', { duration: 3000 });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Failed to copy link');
    }
  }

  if (size === 'sm') {
    return (
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          'flex-shrink-0 flex items-center gap-1 text-xs transition-colors rounded px-1.5 py-0.5',
          copied ? 'text-emerald-600' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copied!' : 'Copy'}
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className={cn('gap-1.5 h-8 px-3 text-xs', copied && 'border-emerald-300 text-emerald-700 bg-emerald-50')}
    >
      {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </Button>
  );
}

// ─── Summary stat card ────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className={cn('bg-card border-t-2 border border-border rounded-xl p-4 flex items-center gap-3', color)}>
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground leading-none">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Create + Result Dialog ───────────────────────────────────────────────────

interface CreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  prefillListingId?: string;
}

export function CreateLinkDialog({ open, onClose, onCreated, prefillListingId }: CreateDialogProps) {
  const [listingId, setListingId] = useState(prefillListingId ?? '');
  const [platform, setPlatform] = useState<Platform>('WHATSAPP');
  const [customTag, setCustomTag] = useState('');
  const [targetLocation, setTargetLocation] = useState('');
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  const { data: listings = [] } = useQuery({
    queryKey: ['agent-listings-for-link'],
    queryFn: () => api.get<Listing[]>('/api/listings/agent'),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.post<{ shareUrl: string }>('/api/tracking-links', {
        listingId,
        platform,
        customTag: customTag.trim() || undefined,
        targetLocation: targetLocation.trim() || undefined,
      }),
    onSuccess: (data) => {
      toast.success('Share link generated!', { duration: 3000 });
      setCreatedUrl(data.shareUrl);
      onCreated();
    },
    onError: () => {
      toast.error('Failed to create tracking link');
    },
  });

  function handleClose() {
    setCreatedUrl(null);
    setListingId(prefillListingId ?? '');
    setPlatform('WHATSAPP');
    setCustomTag('');
    setTargetLocation('');
    onClose();
  }

  function handleWhatsApp() {
    if (!createdUrl) return;
    const text = encodeURIComponent(`Check out this property: ${createdUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener noreferrer');
  }

  const canSubmit = !!listingId && !!platform && !mutation.isPending;

  // ── Result screen ────────────────────────────────────────────────────────
  if (createdUrl) {
    return (
      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              </span>
              Link Generated!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <p className="text-sm text-muted-foreground">Your tracking link is ready to share.</p>

            {/* URL display */}
            <div className="bg-muted/40 rounded-xl border border-border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />
                <p className="text-xs font-mono text-primary break-all">{createdUrl}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <CopyButton url={createdUrl} />
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 px-3 text-xs bg-green-50 border-green-300 text-green-700 hover:bg-green-100 flex-1"
                onClick={handleWhatsApp}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Share on WhatsApp
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              Done
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCreatedUrl(null);
                setListingId(prefillListingId ?? '');
                setPlatform('WHATSAPP');
                setCustomTag('');
                setTargetLocation('');
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Create another
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Create screen ────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Generate Share Link</DialogTitle>
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

          {/* Two-column row for optional fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                Target Location
                <span className="text-muted-foreground font-normal text-xs">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Westlands"
                value={targetLocation}
                onChange={(e) => setTargetLocation(e.target.value)}
                className="w-full h-9 text-sm bg-background border border-input rounded-md px-3 outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                Tag
                <span className="text-muted-foreground font-normal text-xs">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. summer-promo"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                className="w-full h-9 text-sm bg-background border border-input rounded-md px-3 outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!canSubmit} className="gap-1.5">
            <Link2 className="w-3.5 h-3.5" />
            {mutation.isPending ? 'Generating...' : 'Generate Link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Desktop Table ────────────────────────────────────────────────────────────

function DesktopTable({
  links,
  onDelete,
}: {
  links: TrackingLink[];
  onDelete: (id: string) => void;
}) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteLink = links.find((l) => l.id === deleteId);

  return (
    <>
      <div className="hidden md:block overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Listing</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Platform</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Target</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tag</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Clicks</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Inquiries</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Conv %</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {links.map((link) => {
              const convPct =
                link.clickCount > 0
                  ? ((link.inquiryCount / link.clickCount) * 100).toFixed(1)
                  : '—';

              return (
                <tr key={link.id} className="hover:bg-muted/20 transition-colors group">
                  {/* Listing */}
                  <td className="px-4 py-3 max-w-[180px]">
                    <p className="text-sm font-medium text-foreground truncate leading-tight">{link.listing.title}</p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">{link.listing.slug}</p>
                  </td>

                  {/* Platform */}
                  <td className="px-4 py-3">
                    <PlatformBadge platform={link.platform} />
                  </td>

                  {/* Target */}
                  <td className="px-4 py-3">
                    {link.targetLocation ? (
                      <span className="text-xs text-foreground">{link.targetLocation}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </td>

                  {/* Tag */}
                  <td className="px-4 py-3">
                    {link.customTag ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 bg-muted text-muted-foreground rounded-full border border-border">
                        <Tag className="w-2.5 h-2.5" />
                        {link.customTag}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </td>

                  {/* Clicks */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-foreground">{link.clickCount.toLocaleString()}</span>
                  </td>

                  {/* Inquiries */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold text-foreground">{link.inquiryCount.toLocaleString()}</span>
                  </td>

                  {/* Conversion % */}
                  <td className="px-4 py-3 text-right">
                    <span className={cn(
                      'text-sm font-semibold',
                      convPct !== '—' && parseFloat(convPct) > 5 ? 'text-emerald-600' : 'text-foreground'
                    )}>
                      {convPct}{convPct !== '—' && '%'}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3">
                    <p className="text-xs text-foreground">{formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })}</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(link.createdAt), 'MMM d, yyyy')}</p>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <CopyButton url={link.shareUrl} size="sm" />
                      <a
                        href={link.shareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        className="p-1 text-destructive/40 hover:text-destructive transition-colors rounded opacity-0 group-hover:opacity-100"
                        onClick={() => setDeleteId(link.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tracking link?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {deleteLink ? PLATFORM_CONFIG[deleteLink.platform].label : ''} link
              for <strong>{deleteLink?.listing.title}</strong>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) onDelete(deleteId);
                setDeleteId(null);
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

// ─── Mobile card list ─────────────────────────────────────────────────────────

function MobileList({
  links,
  onDelete,
}: {
  links: TrackingLink[];
  onDelete: (id: string) => void;
}) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteLink = links.find((l) => l.id === deleteId);

  return (
    <>
      <div className="md:hidden space-y-3">
        {links.map((link) => {
          const convPct =
            link.clickCount > 0
              ? ((link.inquiryCount / link.clickCount) * 100).toFixed(1) + '%'
              : '—';

          return (
            <div key={link.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
              {/* Top */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <PlatformBadge platform={link.platform} />
                    {link.customTag && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 bg-muted text-muted-foreground rounded-full border border-border">
                        <Tag className="w-2.5 h-2.5" />{link.customTag}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate">{link.listing.title}</p>
                  {link.targetLocation && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{link.targetLocation}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => setDeleteId(link.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <MousePointerClick className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-semibold text-foreground">{link.clickCount.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">clicks</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-semibold text-foreground">{link.inquiryCount.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">inquiries</span>
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-semibold text-foreground text-xs">{convPct}</span>
                </div>
              </div>

              {/* URL */}
              <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-2 border border-border">
                <Globe className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />
                <span className="text-xs font-mono text-primary truncate flex-1">{link.shareUrl}</span>
                <CopyButton url={link.shareUrl} size="sm" />
                <a
                  href={link.shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <p className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })} · {format(new Date(link.createdAt), 'MMM d, yyyy')}
              </p>
            </div>
          );
        })}
      </div>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tracking link?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete the {deleteLink ? PLATFORM_CONFIG[deleteLink.platform].label : ''} link
              for <strong>{deleteLink?.listing.title}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) onDelete(deleteId);
                setDeleteId(null);
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
      <Skeleton className="h-64 rounded-xl" />
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
  const overallConv =
    totalClicks > 0 ? ((totalInquiries / totalClicks) * 100).toFixed(1) + '%' : '—';

  const handleDelete = (id: string) => deleteMutation.mutate(id);
  const handleCreated = () => queryClient.invalidateQueries({ queryKey: ['agent-tracking-links'] });

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
            <p className="text-sm text-muted-foreground mt-0.5">
              {links.length > 0
                ? `${links.length} link${links.length !== 1 ? 's' : ''} · Share and track performance by platform`
                : 'Generate links to share on any platform and track exactly where your leads come from'}
            </p>
          </div>
          <Button
            className="h-9 px-4 text-sm font-semibold gap-1.5"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Generate Share Link
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Total Links" value={links.length} icon={Link2} color="border-t-primary" />
          <StatCard label="Total Clicks" value={totalClicks} icon={MousePointerClick} color="border-t-blue-500" />
          <StatCard
            label="Inquiries"
            value={totalInquiries}
            sub={`${overallConv} conversion`}
            icon={MessageSquare}
            color="border-t-emerald-500 col-span-2 md:col-span-1"
          />
        </div>

        {/* Empty state */}
        {links.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Link2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-display font-semibold text-foreground mb-1">No tracking links yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Create tracking links for your listings to share on WhatsApp, Instagram, and other platforms. See exactly where each lead comes from.
            </p>
            <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="w-4 h-4" />
              Generate your first link
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <DesktopTable links={links} onDelete={handleDelete} />
            {/* Mobile cards */}
            <MobileList links={links} onDelete={handleDelete} />
          </>
        )}
      </div>

      {/* Create dialog */}
      <CreateLinkDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
    </DashboardLayout>
  );
}
