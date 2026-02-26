import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Share2,
  ChevronRight,
  ChevronLeft,
  Check,
  Copy,
  ExternalLink,
  X,
  MessageCircle,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Mail,
  MessageSquare,
  Globe,
  MoreHorizontal,
  Video,
  Users,
  User,
  Megaphone,
  Hash,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────────────────────────────────────────

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

type Placement = { label: string; value: string; icon: React.ReactNode };

interface TrackingLinkResult {
  id: string;
  refCode: string;
  listingId: string;
  platform: Platform;
  targetLocation?: string;
  customTag?: string;
  clickCount: number;
  inquiryCount: number;
  createdAt: string;
  shareUrl: string;
}

// ─── Platform definitions ─────────────────────────────────────────────────────

const PLATFORMS: {
  value: Platform;
  label: string;
  icon: React.ReactNode;
  color: string;
  placements: Placement[];
}[] = [
  {
    value: 'WHATSAPP',
    label: 'WhatsApp',
    icon: <MessageCircle className="w-4 h-4" />,
    color: 'bg-green-500',
    placements: [
      { label: 'Status', value: 'Status', icon: <Megaphone className="w-4 h-4" /> },
      { label: 'Individual', value: 'Individual', icon: <User className="w-4 h-4" /> },
      { label: 'Group', value: 'Group', icon: <Users className="w-4 h-4" /> },
    ],
  },
  {
    value: 'INSTAGRAM',
    label: 'Instagram',
    icon: <Instagram className="w-4 h-4" />,
    color: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400',
    placements: [
      { label: 'Story', value: 'Story', icon: <Megaphone className="w-4 h-4" /> },
      { label: 'Post', value: 'Post', icon: <Hash className="w-4 h-4" /> },
      { label: 'Reel', value: 'Reel', icon: <Video className="w-4 h-4" /> },
      { label: 'DM', value: 'DM', icon: <User className="w-4 h-4" /> },
    ],
  },
  {
    value: 'FACEBOOK',
    label: 'Facebook',
    icon: <Facebook className="w-4 h-4" />,
    color: 'bg-blue-600',
    placements: [
      { label: 'Story', value: 'Story', icon: <Megaphone className="w-4 h-4" /> },
      { label: 'Post', value: 'Post', icon: <Hash className="w-4 h-4" /> },
      { label: 'Group', value: 'Group', icon: <Users className="w-4 h-4" /> },
      { label: 'Marketplace', value: 'Marketplace', icon: <Globe className="w-4 h-4" /> },
      { label: 'Messenger', value: 'Messenger', icon: <MessageCircle className="w-4 h-4" /> },
    ],
  },
  {
    value: 'TIKTOK',
    label: 'TikTok',
    icon: <Video className="w-4 h-4" />,
    color: 'bg-black',
    placements: [
      { label: 'Video', value: 'Video', icon: <Video className="w-4 h-4" /> },
      { label: 'Bio Link', value: 'Bio Link', icon: <ExternalLink className="w-4 h-4" /> },
      { label: 'DM', value: 'DM', icon: <User className="w-4 h-4" /> },
    ],
  },
  {
    value: 'TWITTER_X',
    label: 'X (Twitter)',
    icon: <Twitter className="w-4 h-4" />,
    color: 'bg-gray-900',
    placements: [
      { label: 'Tweet', value: 'Tweet', icon: <Hash className="w-4 h-4" /> },
      { label: 'DM', value: 'DM', icon: <User className="w-4 h-4" /> },
    ],
  },
  {
    value: 'LINKEDIN',
    label: 'LinkedIn',
    icon: <Linkedin className="w-4 h-4" />,
    color: 'bg-blue-700',
    placements: [
      { label: 'Post', value: 'Post', icon: <Hash className="w-4 h-4" /> },
      { label: 'Message', value: 'Message', icon: <User className="w-4 h-4" /> },
    ],
  },
  {
    value: 'EMAIL',
    label: 'Email',
    icon: <Mail className="w-4 h-4" />,
    color: 'bg-amber-500',
    placements: [
      { label: 'Newsletter', value: 'Newsletter', icon: <Megaphone className="w-4 h-4" /> },
      { label: 'Individual', value: 'Individual', icon: <User className="w-4 h-4" /> },
      { label: 'Campaign', value: 'Campaign', icon: <Users className="w-4 h-4" /> },
    ],
  },
  {
    value: 'SMS',
    label: 'SMS',
    icon: <MessageSquare className="w-4 h-4" />,
    color: 'bg-teal-500',
    placements: [
      { label: 'Broadcast', value: 'Broadcast', icon: <Megaphone className="w-4 h-4" /> },
      { label: 'Individual', value: 'Individual', icon: <User className="w-4 h-4" /> },
    ],
  },
  {
    value: 'WEBSITE',
    label: 'Website',
    icon: <Globe className="w-4 h-4" />,
    color: 'bg-indigo-500',
    placements: [
      { label: 'Banner', value: 'Banner', icon: <Megaphone className="w-4 h-4" /> },
      { label: 'Listing Page', value: 'Listing Page', icon: <Hash className="w-4 h-4" /> },
    ],
  },
  {
    value: 'OTHER',
    label: 'Other',
    icon: <MoreHorizontal className="w-4 h-4" />,
    color: 'bg-gray-400',
    placements: [
      { label: 'Direct', value: 'Direct', icon: <ExternalLink className="w-4 h-4" /> },
    ],
  },
];

// ─── Step dots ────────────────────────────────────────────────────────────────

function Steps({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1 rounded-full transition-all duration-300',
            i < current ? 'bg-primary w-5' : i === current ? 'bg-primary w-3' : 'bg-muted w-3'
          )}
        />
      ))}
    </div>
  );
}

// ─── Inner content (shared between Dialog and Sheet) ─────────────────────────

interface InnerProps {
  step: Step;
  setStep: (s: Step) => void;
  selectedPlatform: Platform | null;
  setSelectedPlatform: (p: Platform | null) => void;
  selectedPlacement: string | null;
  setSelectedPlacement: (v: string | null) => void;
  customTag: string;
  setCustomTag: (v: string) => void;
  result: TrackingLinkResult | null;
  copied: boolean;
  isPending: boolean;
  listingTitle: string;
  onClose: () => void;
  onReset: () => void;
  onGenerate: () => void;
  onCopy: (url: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
}

type Step = 'platform' | 'placement' | 'tag' | 'result';

function ShareContent({
  step,
  setStep,
  selectedPlatform,
  setSelectedPlatform,
  selectedPlacement,
  setSelectedPlacement,
  customTag,
  setCustomTag,
  result,
  copied,
  isPending,
  listingTitle,
  onClose,
  onReset,
  onGenerate,
  onCopy,
  searchQuery,
  setSearchQuery,
}: InnerProps) {
  const platformDef = PLATFORMS.find((p) => p.value === selectedPlatform);
  const stepIndex = ['platform', 'placement', 'tag', 'result'].indexOf(step);

  const filteredPlatforms = PLATFORMS.filter((p) =>
    p.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const title =
    step === 'platform'
      ? 'Share Listing'
      : step === 'placement'
      ? `${platformDef?.label} — Placement`
      : step === 'tag'
      ? 'Add a Label'
      : 'Link Ready';

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2.5 min-w-0">
          {step !== 'platform' && step !== 'result' && (
            <button
              onClick={() => {
                if (step === 'placement') setStep('platform');
                else if (step === 'tag') setStep('placement');
              }}
              className="text-muted-foreground hover:text-foreground flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <div className="min-w-0">
            <DialogTitle className="text-sm font-semibold leading-tight text-foreground">
              {title}
            </DialogTitle>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{listingTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {step !== 'result' && <Steps current={stepIndex} total={3} />}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-4 space-y-3 overflow-y-auto max-h-[60vh] md:max-h-[65vh]">
        {/* ── Step 1: Platform ── */}
        {step === 'platform' && (
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search platform..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
                autoComplete="off"
              />
            </div>

            {filteredPlatforms.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">No platforms found</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredPlatforms.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => {
                      setSelectedPlatform(p.value);
                      setSelectedPlacement(null);
                      setSearchQuery('');
                      if (p.placements.length === 1) {
                        setSelectedPlacement(p.placements[0].value);
                        setStep('tag');
                      } else {
                        setStep('placement');
                      }
                    }}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0',
                        p.color
                      )}
                    >
                      {p.icon}
                    </div>
                    <span className="text-sm font-medium text-foreground flex-1 truncate">
                      {p.label}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Placement ── */}
        {step === 'placement' && platformDef && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Where on <span className="font-medium text-foreground">{platformDef.label}</span> will you post?
            </p>
            <div className="space-y-1.5">
              {platformDef.placements.map((pl) => (
                <button
                  key={pl.value}
                  type="button"
                  onClick={() => {
                    setSelectedPlacement(pl.value);
                    setStep('tag');
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    {pl.icon}
                  </div>
                  <span className="text-sm font-medium text-foreground flex-1">{pl.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: Tag (optional) ── */}
        {step === 'tag' && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-2">
              <div
                className={cn(
                  'w-6 h-6 rounded flex items-center justify-center text-white flex-shrink-0',
                  platformDef?.color
                )}
              >
                {platformDef?.icon}
              </div>
              <span className="text-sm font-semibold text-foreground">
                {platformDef?.label}
                {selectedPlacement && ` · ${selectedPlacement}`}
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Label{' '}
                <span className="text-muted-foreground font-normal text-xs">(optional)</span>
              </Label>
              <Input
                placeholder={
                  selectedPlatform === 'WHATSAPP'
                    ? selectedPlacement === 'Group'
                      ? 'e.g. Westlands Buyers...'
                      : selectedPlacement === 'Individual'
                      ? 'e.g. John Kamau...'
                      : 'e.g. Morning status...'
                    : 'e.g. campaign name...'
                }
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                className="h-10"
                onKeyDown={(e) => e.key === 'Enter' && onGenerate()}
              />
              <p className="text-xs text-muted-foreground">
                Helps you identify this link in analytics. Won't appear in the URL.
              </p>
            </div>

            <Button
              className="w-full h-10 font-semibold"
              onClick={onGenerate}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  Generate Trackable Link
                  <ChevronRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* ── Step 4: Result ── */}
        {step === 'result' && result && (
          <div className="space-y-4">
            <div className="flex flex-col items-center py-2 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
                <Check className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="font-semibold text-foreground text-sm">Link ready to share!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Clicks and inquiries are tracked automatically
              </p>
            </div>

            <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-2">
              <div
                className={cn(
                  'w-6 h-6 rounded flex items-center justify-center text-white flex-shrink-0',
                  platformDef?.color
                )}
              >
                {platformDef?.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">
                  {platformDef?.label}
                  {result.targetLocation && ` · ${result.targetLocation}`}
                </p>
                {result.customTag && (
                  <p className="text-xs text-muted-foreground truncate">{result.customTag}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Your trackable link</p>
              <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 py-2.5">
                <p className="text-xs font-mono text-primary truncate flex-1">{result.shareUrl}</p>
                <button
                  type="button"
                  onClick={() => onCopy(result.shareUrl)}
                  className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-2 py-1"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Ref: <span className="font-mono text-foreground">{result.refCode}</span>
            </p>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={onReset}>
                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                Share Again
              </Button>
              <Button size="sm" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SharePanel component ─────────────────────────────────────────────────────

interface SharePanelProps {
  open: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

export function SharePanel({ open, onClose, listingId, listingTitle }: SharePanelProps) {
  const isDesktop = useIsDesktop();
  const [step, setStep] = useState<Step>('platform');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [selectedPlacement, setSelectedPlacement] = useState<string | null>(null);
  const [customTag, setCustomTag] = useState('');
  const [result, setResult] = useState<TrackingLinkResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const createLink = useMutation({
    mutationFn: () =>
      api.post<TrackingLinkResult>('/api/tracking-links', {
        listingId,
        platform: selectedPlatform,
        targetLocation: selectedPlacement ?? undefined,
        customTag: customTag.trim() || undefined,
      }),
    onSuccess: (data) => {
      setResult(data);
      setStep('result');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to create link';
      toast.error(msg);
    },
  });

  const handleReset = () => {
    setStep('platform');
    setSelectedPlatform(null);
    setSelectedPlacement(null);
    setCustomTag('');
    setResult(null);
    setCopied(false);
    setSearchQuery('');
  };

  const handleClose = () => {
    onClose();
    setTimeout(handleReset, 300);
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const sharedProps: InnerProps = {
    step,
    setStep,
    selectedPlatform,
    setSelectedPlatform,
    selectedPlacement,
    setSelectedPlacement,
    customTag,
    setCustomTag,
    result,
    copied,
    isPending: createLink.isPending,
    listingTitle,
    onClose: handleClose,
    onReset: handleReset,
    onGenerate: () => createLink.mutate(),
    onCopy: handleCopy,
    searchQuery,
    setSearchQuery,
  };

  return isDesktop ? (
    /* Desktop: centered dialog */
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="p-0 max-w-sm w-full gap-0 overflow-hidden">
        <ShareContent {...sharedProps} />
      </DialogContent>
    </Dialog>
  ) : (
    /* Mobile: bottom sheet */
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl p-0 max-h-[92vh]">
        <SheetTitle className="sr-only">Share Listing</SheetTitle>
        <ShareContent {...sharedProps} />
      </SheetContent>
    </Sheet>
  );
}
