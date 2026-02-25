import { useState } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
    icon: <MessageCircle className="w-5 h-5" />,
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
    icon: <Instagram className="w-5 h-5" />,
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
    icon: <Facebook className="w-5 h-5" />,
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
    icon: <Video className="w-5 h-5" />,
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
    icon: <Twitter className="w-5 h-5" />,
    color: 'bg-gray-900',
    placements: [
      { label: 'Tweet', value: 'Tweet', icon: <Hash className="w-4 h-4" /> },
      { label: 'DM', value: 'DM', icon: <User className="w-4 h-4" /> },
    ],
  },
  {
    value: 'LINKEDIN',
    label: 'LinkedIn',
    icon: <Linkedin className="w-5 h-5" />,
    color: 'bg-blue-700',
    placements: [
      { label: 'Post', value: 'Post', icon: <Hash className="w-4 h-4" /> },
      { label: 'Message', value: 'Message', icon: <User className="w-4 h-4" /> },
    ],
  },
  {
    value: 'EMAIL',
    label: 'Email',
    icon: <Mail className="w-5 h-5" />,
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
    icon: <MessageSquare className="w-5 h-5" />,
    color: 'bg-teal-500',
    placements: [
      { label: 'Broadcast', value: 'Broadcast', icon: <Megaphone className="w-4 h-4" /> },
      { label: 'Individual', value: 'Individual', icon: <User className="w-4 h-4" /> },
    ],
  },
  {
    value: 'WEBSITE',
    label: 'Website',
    icon: <Globe className="w-5 h-5" />,
    color: 'bg-indigo-500',
    placements: [
      { label: 'Banner', value: 'Banner', icon: <Megaphone className="w-4 h-4" /> },
      { label: 'Listing Page', value: 'Listing Page', icon: <Hash className="w-4 h-4" /> },
    ],
  },
  {
    value: 'OTHER',
    label: 'Other',
    icon: <MoreHorizontal className="w-5 h-5" />,
    color: 'bg-gray-400',
    placements: [
      { label: 'Direct', value: 'Direct', icon: <ExternalLink className="w-4 h-4" /> },
    ],
  },
];

// ─── Step indicators ──────────────────────────────────────────────────────────

function Steps({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1 rounded-full transition-all duration-300',
            i < current
              ? 'bg-primary w-6'
              : i === current
              ? 'bg-primary w-4'
              : 'bg-muted w-4'
          )}
        />
      ))}
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

type Step = 'platform' | 'placement' | 'tag' | 'result';

export function SharePanel({ open, onClose, listingId, listingTitle }: SharePanelProps) {
  const [step, setStep] = useState<Step>('platform');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [selectedPlacement, setSelectedPlacement] = useState<string | null>(null);
  const [customTag, setCustomTag] = useState('');
  const [result, setResult] = useState<TrackingLinkResult | null>(null);
  const [copied, setCopied] = useState(false);

  const platformDef = PLATFORMS.find((p) => p.value === selectedPlatform);

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
  };

  const handleClose = () => {
    onClose();
    // Delay reset so animation plays
    setTimeout(handleReset, 300);
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const stepIndex = ['platform', 'placement', 'tag', 'result'].indexOf(step);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {step !== 'platform' && step !== 'result' && (
              <button
                onClick={() => {
                  if (step === 'placement') setStep('platform');
                  else if (step === 'tag') setStep('placement');
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <SheetTitle className="text-sm font-semibold text-foreground leading-tight">
                {step === 'platform' && 'Share Listing'}
                {step === 'placement' && `${platformDef?.label} — Placement`}
                {step === 'tag' && 'Add a Label (Optional)'}
                {step === 'result' && 'Trackable Link Ready'}
              </SheetTitle>
              <p className="text-xs text-muted-foreground truncate max-w-[240px]">{listingTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {step !== 'result' && <Steps current={stepIndex} total={3} />}
            <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-5">
          {/* ── Step 1: Platform ── */}
          {step === 'platform' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Where will you share this listing? We'll generate a unique trackable link so you can
                see exactly where your clicks and inquiries come from.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => {
                      setSelectedPlatform(p.value);
                      setSelectedPlacement(null);
                      // If only one placement option, auto-select it
                      if (p.placements.length === 1) {
                        setSelectedPlacement(p.placements[0].value);
                        setStep('tag');
                      } else {
                        setStep('placement');
                      }
                    }}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                  >
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0', p.color)}>
                      {p.icon}
                    </div>
                    <span className="text-sm font-medium text-foreground">{p.label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Placement ── */}
          {step === 'placement' && platformDef && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Where on <span className="font-semibold text-foreground">{platformDef.label}</span> will you post this?
              </p>
              <div className="space-y-2">
                {platformDef.placements.map((pl) => (
                  <button
                    key={pl.value}
                    type="button"
                    onClick={() => {
                      setSelectedPlacement(pl.value);
                      setStep('tag');
                    }}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                      {pl.icon}
                    </div>
                    <span className="text-sm font-medium text-foreground">{pl.label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 3: Tag (optional) ── */}
          {step === 'tag' && (
            <div className="space-y-5">
              <div className="bg-muted/50 rounded-xl p-3.5 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Sharing via</p>
                <div className="flex items-center gap-2">
                  <div className={cn('w-6 h-6 rounded flex items-center justify-center text-white text-xs flex-shrink-0', platformDef?.color)}>
                    {platformDef?.icon}
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {platformDef?.label}
                    {selectedPlacement && ` · ${selectedPlacement}`}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Label <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  placeholder={
                    selectedPlatform === 'WHATSAPP'
                      ? selectedPlacement === 'Group'
                        ? 'e.g. Westlands Buyers, Friday Deals...'
                        : selectedPlacement === 'Individual'
                        ? "e.g. John Kamau, Client #47..."
                        : 'e.g. Morning status...'
                      : 'e.g. campaign name, audience label...'
                  }
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  className="h-11"
                  onKeyDown={(e) => e.key === 'Enter' && createLink.mutate()}
                />
                <p className="text-xs text-muted-foreground">
                  This helps you identify this link in your analytics. It won't appear in the URL.
                </p>
              </div>

              <Button
                className="w-full h-11 font-semibold"
                onClick={() => createLink.mutate()}
                disabled={createLink.isPending}
              >
                {createLink.isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Generating link...
                  </>
                ) : (
                  <>
                    Generate Trackable Link
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* ── Step 4: Result ── */}
          {step === 'result' && result && (
            <div className="space-y-5">
              {/* Success indicator */}
              <div className="flex flex-col items-center py-3 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                  <Check className="w-7 h-7 text-emerald-600" />
                </div>
                <p className="font-display font-semibold text-foreground">Link ready to share!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Every click on this link is tracked separately
                </p>
              </div>

              {/* Link summary */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className={cn('w-7 h-7 rounded flex items-center justify-center text-white text-xs flex-shrink-0', platformDef?.color)}>
                    {platformDef?.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                      {platformDef?.label}
                      {result.targetLocation && ` · ${result.targetLocation}`}
                    </p>
                    {result.customTag && (
                      <p className="text-xs text-muted-foreground truncate">{result.customTag}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* URL copy box */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Your trackable link</p>
                <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3.5 py-3">
                  <p className="text-sm font-mono text-primary truncate flex-1">
                    {result.shareUrl}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopy(result.shareUrl)}
                    className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-2.5 py-1.5"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Ref code info */}
              <p className="text-xs text-center text-muted-foreground">
                Ref:{' '}
                <span className="font-mono text-foreground">{result.refCode}</span>
                {' · '}Tracks clicks and inquiries automatically
              </p>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Button variant="outline" onClick={handleReset}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Again
                </Button>
                <Button onClick={handleClose}>Done</Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
